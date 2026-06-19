import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from 'libs/dtos/user/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import { DeleteResult, Types } from 'mongoose';
import { RolesService } from '../roles/roles.service';
import {
  ChatEFService,
  IUser,
  OrderService,
  ProductService,
} from 'libs/utils/interface';
import {
  generateOtp,
  getHashPassword,
  isValidMongoId,
  isValidPassword,
  toObjectId,
} from '../../utils/helper';
import { AccountType, JOBS } from 'libs/utils/constants';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ResetPasswordDto } from 'libs/dtos/auth/auth.dto';
import {
  UpdateUserClientDto,
  UpdateUserDto,
} from 'libs/dtos/user/update-user.dto';
import { randomUUID } from 'crypto';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { USER_ROLE } from '../database/samples/role';

@Injectable()
export class UsersService implements OnModuleInit {
  private productService: ProductService;
  private orderService: OrderService;
  private chatEFService: ChatEFService;

  constructor(
    private rolesService: RolesService,

    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,

    @InjectQueue('mail-queue')
    private mailQueue: Queue,

    @Inject('REDIS') private redis: Redis,

    @Inject('ORDER_SERVICE') private clientOrder: ClientGrpc,
    @Inject('PRODUCT_SERVICE') private clientProduct: ClientGrpc,
    @Inject('MESSAGE_SERVICE') private clientMessage: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService =
      this.clientProduct.getService<ProductService>('ProductService');

    this.orderService =
      this.clientOrder.getService<OrderService>('OrderService');

    this.chatEFService =
      this.clientMessage.getService<ChatEFService>('ChatEFService');
  }

  create = async (createUserDto: CreateUserDto, user: IUser) => {
    const existedUser = await this.findOne(
      createUserDto.email,
      'username',
      true,
    );

    if (existedUser) {
      throw new RpcException('User is already exist');
    }

    return await this.userModel.create({
      ...createUserDto,
      role: toObjectId(createUserDto.role),
      password: getHashPassword(createUserDto.password),
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
  };

  register = async (registerUserDto: RegisterUserDto, isSocial = false) => {
    const existedUser = await this.findOne(
      registerUserDto.email,
      'username',
      true,
    );

    if (existedUser) {
      throw new RpcException('User is already exist');
    }

    const role = await this.rolesService.findRoleUser(USER_ROLE);

    const userId = new Types.ObjectId();

    const result = await this.userModel.create({
      ...registerUserDto,
      _id: userId,
      role,
      isActive: isSocial,
      accountType: isSocial ? registerUserDto.accountType : AccountType.LOCAL,
      password: getHashPassword(registerUserDto.password),
      createdBy: { _id: userId, email: registerUserDto.email },
    });

    if (!isSocial) {
      const otp = generateOtp();

      console.log(otp);

      await this.saveOtp(result.email, otp);

      await this.mailQueue.add(
        JOBS.REGISTER,
        {
          email: result.email,
          name: result.name,
          otp,
        },
        {
          jobId: `register-${result._id}-${randomUUID()}`,
          attempts: 3,
          removeOnComplete: true,
        },
      );
    }

    await result.populate({
      path: 'role',
      select: { _id: 1, name: 1, isActive: 1 },
    });

    return result;
  };

  findAll = async (currentPage: number, limit: number, qs: string) => {
    const aqp = (await import('api-query-params')).default;
    const { filter, population, sort } = aqp(qs);

    const specialSort: Record<string, 1 | -1> = {};

    delete filter.current;
    delete filter.pageSize;

    console.log(filter);

    const search = filter.search;
    delete filter.search;

    for (const key in filter) {
      if (filter[key] === 'max') {
        specialSort[key] = -1;
        delete filter[key];
      }

      if (filter[key] === 'min') {
        specialSort[key] = 1;
        delete filter[key];
      }
    }

    if (filter.role) {
      const names = filter.role.$in ? filter.role.$in : [filter.role];
      const roleIds = await this.rolesService.findRolesByNames(names);
      filter.role = { $in: roleIds };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const finalSort = { ...(sort || {}), ...specialSort };

    if (Object.keys(specialSort).length) {
      limit = 1;
    }

    const pageSize = +limit || 10;
    const offset = (currentPage - 1) * pageSize;

    const [totalItems, result] = await Promise.all([
      this.userModel.countDocuments(filter),

      this.userModel
        .find(filter)
        .select('-password -refreshToken')
        .skip(offset)
        .limit(pageSize)
        .sort(finalSort as any)
        .populate(population)
        .lean()
        .exec(),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      meta: {
        current: currentPage,
        pageSize,
        pages: totalPages,
        total: totalItems,
      },
      result,
    };
  };

  findOne = async (
    op: string,
    strategy: 'id' | 'username' | 'token',
    isCreate = false,
  ) => {
    let query: any;

    switch (strategy) {
      case 'id':
        query = this.userModel.findById(op).select('-password -refreshToken');
        break;

      case 'username':
        query = this.userModel.findOne({ email: op });
        break;

      case 'token':
        query = this.userModel
          .findOne({ refreshToken: op })
          .select('-password');
        break;

      default:
        throw new RpcException('Invalid strategy');
    }

    const user: IUser & { password: string } = await query
      .populate({
        path: 'role',
        select: { _id: 1, name: 1, isActive: 1 },
      })
      .lean();

    if (!user && !isCreate) {
      throw new RpcException('User not found');
    }

    return user;
  };

  update = async (id: string, updateUserDto: UpdateUserDto, user: IUser) => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const result = await this.userModel.updateOne(
      { _id: id },
      {
        ...updateUserDto,
        role: toObjectId(updateUserDto.role),
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new RpcException('User not found');
    }

    return result;
  };

  remove = async (id: string, user: IUser): Promise<DeleteResult> => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const foundUser = await this.findOne(id, 'id');

    if (user.email === foundUser.email) {
      throw new RpcException('User cannot delete itself');
    }

    if (foundUser.role?.name === 'ADMIN') {
      throw new RpcException('Cannot delete adminstrator user');
    }

    const resProducts: any = await lastValueFrom(
      this.productService.findAllProductsByUser(foundUser),
    );

    const products = resProducts?.products ?? [];

    if (products.length > 0) {
      throw new RpcException(
        'Cannot delete user because this user is product provider',
      );
    }

    const resOrders: any = await lastValueFrom(
      this.orderService.findAllOrdersByUser(foundUser),
    );

    const orders = resOrders?.orders ?? [];
    const carts = resOrders?.carts ?? [];

    if (orders.length > 0 || carts.length > 0) {
      throw new RpcException(
        'Cannot delete user because it is used in cart or orders',
      );
    }

    await lastValueFrom(
      this.productService.deleteReviewsByVariantsOrUsers({
        userIds: foundUser?._id ? [foundUser._id.toString()] : [],
      }),
    );

    await lastValueFrom(
      this.chatEFService.deleteConversationByUser({
        userId: foundUser?._id.toString() || '',
      }),
    );

    if (foundUser.role.name === 'PROVIDER' && products.length === 0) {
      await lastValueFrom(
        this.orderService.deleteProviderFeesAndOrdersByOwner({
          ownerId: foundUser._id.toString(),
          user,
        }),
      );
    }

    return await this.userModel.delete(
      { _id: id },
      {
        _id: user._id,
        email: user.email,
      },
    );
  };

  async getUserRoleChart() {
    const result = await this.userModel.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo',
        },
      },
      {
        $unwind: '$roleInfo',
      },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          count: 1,
        },
      },
    ]);

    const roles = ['PROVIDER', 'STAFF', 'USER', 'ADMIN'];

    const mapped = roles.map((role) => {
      const found = result.find((x) => x.role === role);

      return {
        role,
        count: found?.count ?? 0,
      };
    });

    return {
      labels: mapped.map((x) => x.role),
      datasets: [
        {
          data: mapped.map((x) => x.count),
        },
      ],
      total: mapped.reduce((a, b) => a + b.count, 0),
    };
  }

  updateUserRefreshToken = async (
    refreshToken: string,
    _id: Types.ObjectId,
  ) => {
    const result = await this.userModel.updateOne({ _id }, { refreshToken });

    if (result.matchedCount === 0) {
      throw new RpcException('User not found');
    }

    return result;
  };

  getAllFiles = async () => {
    const users = await this.userModel.find().select('image').lean();
    return users.map((u) => u.image);
  };

  saveOtp = async (email: string, otp: string) => {
    const otpKey = `otp:${email}`;
    const attemptKey = `otp_attempts:${email}`;

    await this.redis.set(otpKey, getHashPassword(otp), 'EX', 300);
    await this.redis.set(attemptKey, 0, 'EX', 300);
  };

  verifyAccount = async (
    otp: string,
    email: string,
    type: 'register' | 'reset',
    confirmedPassword?: string,
  ) => {
    if (!(type === 'register' || type === 'reset')) {
      throw new RpcException('Invalid type');
    }

    const user = await this.findOne(email, 'username');

    if (type === 'register' && user.isActive) {
      throw new RpcException('Account is already activated');
    }

    if (type === 'reset' && !user.isActive) {
      throw new RpcException('Account is not activated');
    }

    const otpKey = `otp:${email}`;
    const attemptKey = `otp_attempts:${email}`;

    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp) {
      throw new RpcException('OTP expired or invalid');
    }

    const attempts = Number(await this.redis.get(attemptKey)) || 0;

    if (attempts >= 5) {
      await this.redis.del(otpKey);
      await this.redis.del(attemptKey);
      throw new RpcException('Too many OTP attempts');
    }

    const isValid = isValidPassword(otp, storedOtp);

    if (!isValid) {
      const newAttempts = await this.redis.incr(attemptKey);

      if (newAttempts === 1) {
        await this.redis.expire(attemptKey, 300);
      }

      throw new RpcException('Invalid OTP');
    }

    await this.redis.del(otpKey);
    await this.redis.del(attemptKey);

    let payload: any = {
      updatedBy: {
        _id: user._id,
        email: user.email,
      },
    };

    if (type === 'register') {
      payload = { ...payload, isActive: true };
    }

    if (type === 'reset') {
      if (!confirmedPassword) {
        throw new RpcException('Password is required');
      }
      payload = {
        ...payload,
        password: getHashPassword(confirmedPassword),
      };
    }

    return await this.userModel.updateOne({ email }, payload);
  };

  resendOtp = async (email: string, type: 'register' | 'reset') => {
    if (!(type === 'register' || type === 'reset')) {
      throw new RpcException('Invalid type');
    }

    const user = await this.findOne(email, 'username');

    if (user.accountType !== AccountType.LOCAL) {
      throw new RpcException('Social account cannot reset password');
    }

    if (type === 'register' && user.isActive) {
      throw new RpcException('Account is already activated');
    }

    if (type === 'reset' && !user.isActive) {
      throw new RpcException('Account is not activated');
    }

    const cooldownKey = `otp_cooldown:${email}`;

    const cooldown = await this.redis.exists(cooldownKey);

    if (cooldown) {
      throw new RpcException('Please wait before requesting another OTP');
    }

    await this.redis.set(cooldownKey, '1', 'EX', 60);

    const otp = generateOtp();

    console.log(otp);

    await this.saveOtp(user.email, otp);

    await this.mailQueue.add(
      type === 'register' ? JOBS.REGISTER : JOBS.RESET,
      {
        email: user.email,
        name: user.name,
        otp,
      },
      {
        jobId: `${type}-${user._id}-${randomUUID()}`,
        attempts: 3,
        removeOnComplete: true,
      },
    );

    return 'Resend otp';
  };

  resetPassword = async (resetPasswordDto: ResetPasswordDto) => {
    const { otp, email, password, confirmedPassword } = resetPasswordDto;

    if (password !== confirmedPassword) {
      throw new RpcException('Password and confirm password not match');
    }

    return await this.verifyAccount(otp, email, 'reset', confirmedPassword);
  };

  updateProfileClient = async (
    UpdateUserClientDto: UpdateUserClientDto,
    user: IUser,
  ) => {
    const { newPassword, ...rest } = UpdateUserClientDto;

    const isEmailExisted = await this.userModel.findOne({ email: rest.email });

    if (
      isEmailExisted &&
      isEmailExisted._id.toString() !== user._id.toString()
    ) {
      throw new RpcException('Email is already exist');
    }

    let payload: any = {
      ...rest,
      updatedBy: {
        _id: user._id,
        email: user.email,
      },
    };

    if (newPassword && newPassword !== '') {
      payload.password = getHashPassword(newPassword);
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: user._id }, payload, { returnDocument: 'after' })
      .populate({
        path: 'role',
        select: { _id: 1, name: 1, isActive: 1 },
      })
      .select('-password -refreshToken');

    if (!updatedUser) {
      throw new RpcException('User is not exist');
    }

    if (user.email !== updatedUser.email) {
      await lastValueFrom(
        this.productService.updateProductCreatedBy({
          oldEmail: user.email,
          newEmail: updatedUser.email,
        }),
      );
    }

    return updatedUser;
  };

  findAllUsers = async (ops: string[], strategy: 'id' | 'email') => {
    if (!(strategy === 'id' || strategy === 'email')) {
      throw new RpcException('Invalid strategy');
    }

    const field = strategy === 'id' ? '_id' : 'email';

    const result = await this.userModel
      .find({ [field]: { $in: ops } })
      .populate({
        path: 'role',
        select: { _id: 1, name: 1, isActive: 1 },
      })
      .select('-password -refreshToken')
      .lean();

    return { result };
  };

  findAllUsersStreaming = async (queries?: any[]) => {
    const result = await this.userModel
      .find(queries ? { $or: queries } : {})
      .populate({
        path: 'role',
        select: { _id: 1, name: 1, isActive: 1 },
      })
      .select('-password -refreshToken')
      .lean();

    return { result };
  };
}
