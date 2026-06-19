import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from 'libs/dtos/permission/create-permission.dto';
import { UpdatePermissionDto } from 'libs/dtos/permission/update-permission.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { SoftDeleteModel } from 'mongoose-delete';
import { IUser } from 'libs/utils/interface';
import { DeleteResult } from 'mongoose';
import { isValidMongoId } from '../../utils/helper';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,
  ) {}

  create = async (createPermissionDto: CreatePermissionDto, user: IUser) => {
    const existedPermission = await this.permissionModel
      .findOne({
        apiPath: createPermissionDto.apiPath,
        method: createPermissionDto.method,
      })
      .lean();

    if (existedPermission) {
      throw new RpcException('Permission is already exist');
    }

    return await this.permissionModel.create({
      ...createPermissionDto,
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
      this.permissionModel.countDocuments(filter),

      this.permissionModel
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

    const result = await this.permissionModel.findById(id).lean();

    if (!result) {
      throw new RpcException('Permission not found');
    }

    return result;
  };

  update = async (
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    user: IUser,
  ) => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const existedPermission = await this.permissionModel
      .findOne({
        apiPath: updatePermissionDto.apiPath,
        method: updatePermissionDto.method,
        _id: { $ne: id },
      })
      .lean();

    if (existedPermission) {
      throw new RpcException('Permission is already exist');
    }

    const result = await this.permissionModel.updateOne(
      { _id: id },
      {
        ...updatePermissionDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new RpcException('Permission not found');
    }

    return result;
  };

  remove = async (id: string, user: IUser): Promise<DeleteResult> => {
    if (!isValidMongoId(id)) {
      throw new RpcException('Invalid mongo id');
    }

    const existedPermission = await this.permissionModel.findById(id).lean();

    if (!existedPermission) {
      throw new RpcException('Permission not found');
    }

    return await this.permissionModel.delete(
      { _id: id },
      {
        _id: user._id,
        email: user.email,
      },
    );
  };
}
