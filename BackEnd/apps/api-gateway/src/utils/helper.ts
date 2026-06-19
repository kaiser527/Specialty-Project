import { BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom, lastValueFrom, Observable } from 'rxjs';

export const normalizePath = (path: string): string => {
  return path.replace(/\/+$/, '');
};

export const normalizeDynamicPath = (path: string): string => {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
  return path
    .split('/')
    .map((segment) => {
      if (/^\d+$/.test(segment)) return ':id';
      if (OBJECT_ID_REGEX.test(segment) || UUID_REGEX.test(segment)) {
        return ':id';
      }
      return segment;
    })
    .join('/');
};

export const buildPermissionKey = (method: string, path: string): string => {
  return `${method.toUpperCase()}:${normalizePath(path)}`;
};

export const buildRequestPermissionKey = (request: Request): string => {
  const rawPath = `${request.baseUrl ?? ''}${request.path}`;

  const normalizedPath = normalizeDynamicPath(rawPath);

  return buildPermissionKey(request.method, normalizedPath);
};

export const handleRpcRedis = async (
  client: ClientProxy,
  pattern: string,
  payload: any,
) => {
  try {
    return await firstValueFrom(client.send(pattern, payload));
  } catch (error) {
    throw new BadRequestException(error?.message || 'Operation failed');
  }
};

export const grpcCall = async <T>(obs$: Observable<T>): Promise<T> => {
  try {
    return await lastValueFrom(obs$);
  } catch (error) {
    throw new BadRequestException(error?.message || 'Operation failed');
  }
};

export const toCamelCase = (str: string): string => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

export const normalizeKeys = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(normalizeKeys);
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[toCamelCase(key)] = normalizeKeys(val);
      return acc;
    }, {} as any);
  }

  return value;
};
