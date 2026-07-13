import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/categories.entity';
import { Between, In, Like, Not, Repository } from 'typeorm';
import { getEndDate, getStartDate } from 'libs/utils/helpers';
import { CreateCategoryDto } from 'libs/dtos/category/create-category.dto';
import { UpdateCategoryDto } from 'libs/dtos/category/update-category.dto';
import { IUser } from 'libs/utils/interface';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  findOne = async (
    op: string,
    strategy: keyof Pick<Category, 'id' | 'name'> = 'id',
  ) => {
    return await this.categoriesRepository.findOneBy({ [strategy]: op });
  };

  findByNames = async (names: string[]) => {
    return await this.categoriesRepository.find({
      where: { name: In(names) },
    });
  };

  findByNameRegex = async (regex: string) => {
    return await this.categoriesRepository.find({
      where: { name: Like(`%${regex}%`) },
    });
  };

  findAll = async (currentPage: number, limit: number, qs: string) => {
    const aqp = (await import('api-query-params')).default;
    const { filter, sort } = aqp(qs);

    delete filter.current;
    delete filter.pageSize;

    const newFilter: any = {};

    for (const key in filter) {
      const value = filter[key];

      if (key === 'createdAt' || key === 'updatedAt') continue;

      if (typeof value === 'string') {
        newFilter[key] = Like(`%${value}%`);
      } else {
        newFilter[key] = value;
      }
    }

    if (filter?.createdAt?.$in) {
      newFilter.createdAt = Between(
        getStartDate(filter.createdAt.$in[0]),
        getEndDate(filter.createdAt.$in[1]),
      );
    }

    if (filter?.updatedAt?.$in) {
      newFilter.updatedAt = Between(
        getStartDate(filter.updatedAt.$in[0]),
        getEndDate(filter.updatedAt.$in[1]),
      );
    }

    const order: any = {};
    if (sort) {
      for (const key in sort) {
        order[key] = sort[key] === 1 ? 'DESC' : 'ASC';
      }
    }

    const [result, total] = await this.categoriesRepository.findAndCount({
      where: newFilter,
      take: limit,
      skip: (currentPage - 1) * limit,
      order: Object.keys(order).length ? order : { createdAt: 'DESC' },
    });

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: Math.ceil(total / limit),
        total,
      },
      result,
    };
  };

  create = async (dto: CreateCategoryDto, user: IUser) => {
    const isExist = await this.categoriesRepository.findOneBy({
      name: dto.name,
    });

    if (isExist) {
      throw new RpcException('Category is already exist');
    }

    return this.categoriesRepository.save({ ...dto, createdBy: user.email });
  };

  update = async (id: string, dto: UpdateCategoryDto, user: IUser) => {
    //@ts-ignore
    const { user: _, id: __, ...rest } = dto;

    const isExist = await this.categoriesRepository.findOneBy({
      name: rest.name,
      id: Not(id),
    });

    if (isExist) {
      throw new RpcException('Category is already exist');
    }

    return this.categoriesRepository.update(id, {
      ...rest,
      updatedBy: user.email,
    });
  };

  delete = async (id: string, user: IUser) => {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { products: true },
    });

    if (!category) {
      throw new RpcException('Category is not exist');
    }

    if (category.products.length > 0) {
      throw new RpcException('There are products related with this category');
    }

    await this.categoriesRepository.update(id, {
      isDeleted: true,
      deletedBy: user.email,
    });

    await this.categoriesRepository.softDelete(category.id);

    return { message: 'Delete success' };
  };
}
