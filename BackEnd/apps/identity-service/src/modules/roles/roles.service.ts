import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from 'libs/dtos/role/create-role.dto';
import { UpdateRoleDto } from 'libs/dtos/role/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import { IUser } from 'libs/utils/interface';
import { DeleteResult } from 'mongoose';
import { isValidMongoId, toObjectId } from '../../utils/helper';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  create = async (createRoleDto: CreateRoleDto, user: IUser) => {
    const existedRole = await this.roleModel
      .findOne({
        name: createRoleDto.name,
      })
      .lean();

    if (existedRole) {
      throw new RpcException('Role is already exist');
    }

    return await this.roleModel.create({
      ...createRoleDto,
      name: createRoleDto.name.toUpperCase(),
      permissions: createRoleDto.permissions.map((p) => toObjectId(p)),
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
  };

  findAll = async (currentPage: number, limit: number, qs: string) => {
    const aqp = (await import('api-query-params')).default;

    const { filter, population, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const pageSize = +limit || 10;
    const offset = (currentPage - 1) * pageSize;

    const [totalItems, result] = await Promise.all([
      this.roleModel.countDocuments(filter),

      this.roleModel
        .find(filter)
        .skip(offset)
        .limit(pageSize)
        .sort(sort as any)
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

  findOne = async (id: string) => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const result = await this.roleModel
      .findById(id)
      .populate({
        path: 'permissions',
        select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 },
      })
      .lean();

    if (!result) {
      throw new RpcException('Role not found');
    }

    return result;
  };

  update = async (id: string, updateRoleDto: UpdateRoleDto, user: IUser) => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const result = await this.roleModel.updateOne(
      { _id: id },
      {
        ...updateRoleDto,
        permissions: updateRoleDto.permissions.map((p) => toObjectId(p)),
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new RpcException('Role not found');
    }

    return result;
  };

  remove = async (id: string, user: IUser): Promise<DeleteResult> => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const existedRole = await this.roleModel.findById(id).lean();

    if (!existedRole) {
      throw new RpcException('Role not found');
    }

    const protectedRoles = ['USER', 'ADMIN', 'STAFF', 'PROVIDER'];

    if (protectedRoles.includes(existedRole.name)) {
      throw new RpcException('This role can not be deleted');
    }

    return await this.roleModel.delete(
      { _id: id },
      {
        _id: user._id,
        email: user.email,
      },
    );
  };

  findRoleUser = async (name: string) => {
    const result = await this.roleModel.findOne({ name }).lean();

    if (!result) {
      throw new RpcException('Role not found');
    }

    return result._id;
  };

  findRolesByNames = async (names: string[]) => {
    const roles = await this.roleModel.find({ name: { $in: names } }).lean();

    if (roles.length === 0) return [];

    return roles.map((role) => role._id);
  };
}
