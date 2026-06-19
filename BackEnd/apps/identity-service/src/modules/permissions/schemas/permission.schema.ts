import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Method } from 'libs/utils/constants';
import { IAuthorObject } from 'libs/utils/interface';
import { HydratedDocument, Types } from 'mongoose';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  apiPath: string;

  @Prop({ required: true })
  module: string;

  @Prop({
    type: String,
    enum: Object.values(Method),
    required: true,
  })
  method: Method;

  @Prop({ default: false })
  deleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt: Date;

  @Prop({ type: Object })
  createdBy: IAuthorObject;

  @Prop({ type: Object })
  updatedBy: IAuthorObject;

  @Prop({ type: Object })
  deletedBy: IAuthorObject;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
