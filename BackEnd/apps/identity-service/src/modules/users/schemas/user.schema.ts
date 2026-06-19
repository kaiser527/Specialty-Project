import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../roles/schemas/role.schema';
import { IAuthorObject } from 'libs/utils/interface';
import { AccountType } from 'libs/utils/constants';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: 'user.png' })
  image: string;

  @Prop({
    type: String,
    enum: Object.values(AccountType),
    required: true,
  })
  accountType: AccountType;

  @Prop({
    type: Types.ObjectId,
    ref: Role.name,
    required: true,
  })
  role: Types.ObjectId;

  @Prop()
  refreshToken: string;

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

export const UserSchema = SchemaFactory.createForClass(User);
