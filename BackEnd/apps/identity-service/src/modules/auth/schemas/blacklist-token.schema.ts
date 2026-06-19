import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type lacklistTokenDocument = HydratedDocument<BlacklistToken>;

@Schema()
export class BlacklistToken {
  @Prop({ unique: true })
  jti: string;

  @Prop({ required: true })
  type: string;

  @Prop({
    required: true,
    index: { expires: 0 },
  })
  expiryDate: Date;
}

export const BlacklistTokenSchema =
  SchemaFactory.createForClass(BlacklistToken);
