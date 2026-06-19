import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IAuthorObject } from 'libs/utils/interface';
import { HydratedDocument, Types } from 'mongoose';
import { Permission } from '../../permissions/schemas/permission.schema';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: [Types.ObjectId], default: [], ref: Permission.name })
  permissions: Types.ObjectId[];

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

export const RoleSchema = SchemaFactory.createForClass(Role);
