import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  GrpcMethod,
  GrpcStreamMethod,
  RpcException,
} from '@nestjs/microservices';
import { defer, from, mergeMap, Observable, toArray } from 'rxjs';
import { isValidMongoId } from '../../utils/helper';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('IdentityService', 'findOne')
  async findOne(data: { op: string; strategy: string }) {
    return await this.usersService.findOne(
      data.op,
      data.strategy as 'id' | 'username' | 'token',
    );
  }

  @GrpcMethod('IdentityService', 'findAll')
  async findAll(data: { currentPage: number; limit: number; qs: string }) {
    return await this.usersService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      data.qs,
    );
  }

  @GrpcMethod('IdentityService', 'findAllPopulate')
  async findAllPopulate(data: {
    currentPage: number;
    limit: number;
    qs: string;
  }) {
    let newQs = data.qs?.trim()
      ? `${data.qs}&populate=role&fields=role._id,role.name`
      : `populate=role&fields=role._id,role.name`;

    return await this.usersService.findAll(
      data.currentPage || 1,
      data.limit || 10,
      newQs,
    );
  }

  @GrpcMethod('IdentityService', 'findAllUsers')
  async findAllUsers(data: { ops: string[]; strategy: string }) {
    return await this.usersService.findAllUsers(
      data.ops,
      data.strategy as 'id' | 'email',
    );
  }

  @GrpcStreamMethod('IdentityService', 'findAllUsersClientStreaming')
  findAllUsersClientStreaming(
    stream: Observable<{ op: string; strategy: string }>,
  ) {
    return stream.pipe(
      toArray(),
      mergeMap(async (items) => {
        if (!items.length) return { result: [] };

        const ids = new Set<string>();
        const emails = new Set<string>();

        for (const item of items) {
          if (item.strategy === 'id' && isValidMongoId(item.op))
            ids.add(item.op);
          if (item.strategy === 'email') emails.add(item.op);
        }

        const queries: any[] = [];

        if (ids.size) queries.push({ _id: { $in: [...ids] } });
        if (emails.size) queries.push({ email: { $in: [...emails] } });

        if (!queries.length) return { result: [] };

        return await this.usersService.findAllUsersStreaming(queries);
      }),
    );
  }

  @GrpcMethod('IdentityService', 'findAllUsersServerStreaming')
  async findAllUsersServerStreaming() {
    return defer(() => this.usersService.findAllUsersStreaming()).pipe(
      mergeMap((res) => from(res.result)),
    );
  }

  @GrpcStreamMethod('IdentityService', 'findUsersBidirectional')
  findUsersBidirectional(
    stream: Observable<{ op: string; strategy: string }>,
  ): Observable<any> {
    return stream.pipe(
      mergeMap(async (item) => {
        const { op, strategy } = item;

        if (!(strategy === 'id' || strategy === 'email')) {
          throw new RpcException('Invalid strategy');
        }

        if (strategy === 'id' && !isValidMongoId(op)) {
          throw new RpcException('Invalid Mongo Id');
        }

        const field = strategy === 'id' ? '_id' : 'email';

        const users = await this.usersService.findAllUsersStreaming([
          { [field]: op },
        ]);

        return users.result;
      }),
      mergeMap((users) => from(users)),
    );
  }
}
