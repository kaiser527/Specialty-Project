import { Raw } from 'typeorm';
import { IUser } from './interface';
import dayjs from 'dayjs';

export const userPayload = (user: IUser): IUser => ({
  _id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  gender: user.gender,
  address: user.address,
  age: user.age,
  image: user.image,
  accountType: user.accountType,
  permissions: user.permissions ?? [],
});

export const getStartDate = (date: Date) => {
  return dayjs(date).startOf('day').toDate();
};

export const getEndDate = (date: Date) => {
  return dayjs(date).endOf('day').toDate();
};

export const randomNumber = (min = 1, max = 5) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const buildWhere = (
  column: string,
  value: any,
  options?: {
    transform?: (col: string) => string;
    paramPrefix?: string;
  },
) => {
  const colExpr = options?.transform ? options.transform(column) : column;
  const prefix = options?.paramPrefix || column;

  if (value && typeof value === 'object') {
    if (value.$gte !== undefined && value.$lte !== undefined) {
      return Raw(() => `${colExpr} BETWEEN :${prefix}Min AND :${prefix}Max`, {
        [`${prefix}Min`]: value.$gte,
        [`${prefix}Max`]: value.$lte,
      });
    }

    if (value.$in?.length) {
      return Raw(() => `${colExpr} IN (:...${prefix})`, {
        [prefix]: value.$in,
      });
    }

    if (value.$gt !== undefined)
      return Raw(() => `${colExpr} > :${prefix}Gt`, {
        [`${prefix}Gt`]: value.$gt,
      });

    if (value.$gte !== undefined)
      return Raw(() => `${colExpr} >= :${prefix}Gte`, {
        [`${prefix}Gte`]: value.$gte,
      });

    if (value.$lt !== undefined)
      return Raw(() => `${colExpr} < :${prefix}Lt`, {
        [`${prefix}Lt`]: value.$lt,
      });

    if (value.$lte !== undefined)
      return Raw(() => `${colExpr} <= :${prefix}Lte`, {
        [`${prefix}Lte`]: value.$lte,
      });
  }

  return Raw(() => `${colExpr} = :${prefix}Eq`, {
    [`${prefix}Eq`]: value,
  });
};

export const applyBuildWhereQB = (
  qb: any,
  column: string,
  value: any,
  options?: {
    transform?: (col: string) => string;
    paramPrefix?: string;
  },
) => {
  const colExpr = options?.transform ? options.transform(column) : column;

  const prefix = options?.paramPrefix || column;

  if (value && typeof value === 'object') {
    if (value.$gte !== undefined && value.$lte !== undefined) {
      qb.andWhere(`${colExpr} BETWEEN :${prefix}Min AND :${prefix}Max`, {
        [`${prefix}Min`]: value.$gte,

        [`${prefix}Max`]: value.$lte,
      });

      return;
    }

    if (value.$in?.length) {
      qb.andWhere(`${colExpr} IN (:...${prefix})`, {
        [prefix]: value.$in,
      });

      return;
    }

    if (value.$gt !== undefined) {
      qb.andWhere(`${colExpr} > :${prefix}Gt`, {
        [`${prefix}Gt`]: value.$gt,
      });

      return;
    }

    if (value.$gte !== undefined) {
      qb.andWhere(`${colExpr} >= :${prefix}Gte`, {
        [`${prefix}Gte`]: value.$gte,
      });

      return;
    }

    if (value.$lt !== undefined) {
      qb.andWhere(`${colExpr} < :${prefix}Lt`, {
        [`${prefix}Lt`]: value.$lt,
      });

      return;
    }

    if (value.$lte !== undefined) {
      qb.andWhere(`${colExpr} <= :${prefix}Lte`, {
        [`${prefix}Lte`]: value.$lte,
      });

      return;
    }
  }

  qb.andWhere(`${colExpr} = :${prefix}Eq`, {
    [`${prefix}Eq`]: value,
  });
};
