import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BlacklistToken,
  BlacklistTokenSchema,
} from './schemas/blacklist-token.schema';
import { RolesModule } from '../roles/roles.module';
import { AuthService } from './auth.service';
import { AuthMessageController } from './auth.message.controller';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    MongooseModule.forFeature([
      { name: BlacklistToken.name, schema: BlacklistTokenSchema },
    ]),
    JwtModule,
  ],
  controllers: [AuthMessageController],
  providers: [AuthService],
  exports: [],
})
export class AuthModule {}
