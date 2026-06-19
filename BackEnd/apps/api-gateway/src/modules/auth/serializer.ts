import { PassportSerializer } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { IUser } from 'libs/utils/interface';
import { ClientProxy } from '@nestjs/microservices';
import { handleRpcRedis } from '../../utils/helper';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(@Inject('IDENTITY_SERVICE') private authClient: ClientProxy) {
    super();
  }

  serializeUser(user: IUser, done: Function) {
    done(null, user);
  }

  async deserializeUser(payload: any, done: Function) {
    const user = await handleRpcRedis(this.authClient, 'user.findById', {
      id: payload._id,
      isCreate: true,
    });
    return user ? done(null, user) : done(null, null);
  }
}
