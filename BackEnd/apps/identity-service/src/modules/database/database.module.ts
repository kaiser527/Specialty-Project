import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import MongooseDelete from 'mongoose-delete';
import {
  Permission,
  PermissionSchema,
} from '../permissions/schemas/permission.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
        connectionFactory: (connection) => {
          connection.plugin(MongooseDelete, {
            deletedAt: true,
            overrideMethods: 'all',
          });
          return connection;
        },
      }),
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
