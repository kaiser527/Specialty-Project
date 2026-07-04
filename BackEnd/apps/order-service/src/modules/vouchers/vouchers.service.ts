import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Voucher } from './entities/vouchers.entities';
import { Between, EntityManager, Like, Not, Repository } from 'typeorm';
import { VoucherUsage } from './entities/voucher-usages.entities';
import { CreateVoucherDto } from 'libs/dtos/voucher/create-voucher.dto';
import { IUser } from 'libs/utils/interface';
import { RpcException } from '@nestjs/microservices';
import { Order } from '../orders/entities/orders.entity';
import { getEndDate, getStartDate } from 'libs/utils/helpers';
import { UpdateVoucherDto } from 'libs/dtos/voucher/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private vouchersRepository: Repository<Voucher>,

    @InjectRepository(VoucherUsage)
    private voucherUsageRepository: Repository<VoucherUsage>,
  ) {}

  private generateVoucherCode(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  private async generateUniqueVoucherCode(): Promise<string> {
    while (true) {
      const code = this.generateVoucherCode();

      const exists = await this.vouchersRepository.count({
        where: { code },
      });

      if (exists === 0) return code;
    }
  }

  async createVoucher(dto: CreateVoucherDto, user: IUser) {
    if (dto.code) {
      if (dto.code.length < 6) {
        throw new RpcException('Voucher code must be at least 6 characters');
      } else {
        const isExist = await this.vouchersRepository.findOne({
          where: { code: dto.code.toUpperCase() },
        });
        if (isExist) {
          throw new RpcException('Voucher is already exist');
        }
      }
    }

    const voucher = this.vouchersRepository.create({
      ...dto,
      code: dto.code
        ? dto.code.toUpperCase()
        : await this.generateUniqueVoucherCode(),
      createdBy: user.email,
    });

    await this.vouchersRepository.save(voucher);

    return { message: 'Voucher created successfully' };
  }

  async applyVoucher(
    manager: EntityManager,
    voucherCode: string,
    order: Order,
    userId: string,
  ) {
    const voucher = await manager.findOne(Voucher, {
      where: {
        code: voucherCode,
        active: true,
      },
    });

    if (!voucher) {
      throw new RpcException('Voucher not found');
    }

    if (voucher.expirationDate < new Date()) {
      throw new RpcException('Voucher has expired');
    }

    const existedUsage = await manager.exists(VoucherUsage, {
      where: {
        voucherId: voucher.id,
        userId,
      },
    });

    if (existedUsage) {
      throw new RpcException('Voucher already used');
    }

    const discountAmount = Number(voucher.discountAmount);
    const totalPrice = Number(order.totalPrice);

    if (discountAmount > totalPrice) {
      throw new RpcException(
        'Voucher discount amount cannot exceed order total price',
      );
    }

    order.voucherId = voucher.id;
    order.voucherCode = voucher.code;
    order.discountAmount = discountAmount;
    order.totalPrice = totalPrice - discountAmount;

    await manager.save(Order, order);

    await manager.save(VoucherUsage, {
      voucherId: voucher.id,
      userId,
      orderId: order.id,
    });
  }

  findAllVouchers = async (currentPage: number, limit: number, qs: string) => {
    const aqp = (await import('api-query-params')).default;
    const { filter, sort } = aqp(qs);

    delete filter.current;
    delete filter.pageSize;

    const newFilter: any = {};

    for (const key in filter) {
      const value = filter[key];

      if (
        key === 'createdAt' ||
        key === 'updatedAt' ||
        key === 'expirationDate'
      )
        continue;

      if (typeof value === 'string') newFilter[key] = Like(`%${value}%`);
      else newFilter[key] = value;
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

    if (filter?.expirationDate?.$in) {
      newFilter.expirationDate = Between(
        getStartDate(filter.expirationDate.$in[0]),
        getEndDate(filter.expirationDate.$in[1]),
      );
    }

    const order: any = {};
    if (sort) {
      for (const key in sort) {
        order[key] = sort[key] === 1 ? 'DESC' : 'ASC';
      }
    }

    const [result, total] = await this.vouchersRepository.findAndCount({
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

  async deleteVoucher(id: string) {
    const voucher = await this.vouchersRepository.findOneBy({ id });

    if (!voucher) {
      throw new RpcException('Voucher not found');
    }

    await this.vouchersRepository.delete(id);

    return { message: 'Voucher deleted successfully' };
  }

  async findVoucherByCodeAndUser(code: string, user: IUser) {
    const voucher = await this.vouchersRepository.findOne({
      where: { code, active: true },
    });

    if (!voucher) {
      throw new RpcException('Voucher not found');
    }

    if (voucher.expirationDate < new Date()) {
      throw new RpcException('Voucher has expired');
    }

    const usage = await this.voucherUsageRepository.findOne({
      where: { voucherId: voucher.id, userId: user._id.toString() },
    });

    if (usage) {
      throw new RpcException('Voucher already used');
    }

    return voucher;
  }

  async updateVoucher(dto: UpdateVoucherDto, user: IUser) {
    const { id, ...rest } = dto;

    if (rest.code) {
      if (rest.code.length < 6) {
        throw new RpcException('Voucher code must be at least 6 characters');
      } else {
        const exists = await this.vouchersRepository.count({
          where: {
            code: rest.code.toUpperCase(),
            id: Not(id),
          },
        });
        if (exists > 0) {
          throw new RpcException('Voucher code already exists');
        }
      }
    }

    const result = await this.vouchersRepository.update(id, {
      ...rest,
      ...(rest.code && { code: rest.code.toLocaleUpperCase() }),
      updatedBy: user.email,
    });

    if (result.affected === 0) {
      throw new RpcException('Voucher not found');
    }

    return { message: 'Voucher updated successfully' };
  }

  findAllUsages = async (currentPage: number, limit: number, qs: string) => {
    const aqp = (await import('api-query-params')).default;
    const { filter, sort } = aqp(qs);

    delete filter.current;
    delete filter.pageSize;

    const newFilter: any = {};

    for (const key in filter) {
      const value = filter[key];

      const enumFields = ['orderId', 'userId'];

      if (key === 'createdAt' || key === 'updatedAt') continue;

      if (enumFields.includes(key)) {
        newFilter[key] = value;
      } else if (typeof value === 'string') {
        if (key === 'code') {
          newFilter.voucher = {
            code: Like(`%${value}%`),
          };
        } else {
          newFilter[key] = Like(`%${value}%`);
        }
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

    const [result, total] = await this.voucherUsageRepository.findAndCount({
      where: newFilter,
      take: limit,
      skip: (currentPage - 1) * limit,
      order: Object.keys(order).length ? order : { createdAt: 'DESC' },
      relations: { order: true },
      select: { order: { discountAmount: true, voucherCode: true } },
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
}
