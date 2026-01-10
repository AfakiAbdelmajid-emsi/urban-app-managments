import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AlertDocument = HydratedDocument<Alert>;

@Schema()
export class Alert {
  _id?: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  latitude!: number;

  @Prop({ required: true })
  longitude!: number;

  @Prop()
  photo?: string;

  @Prop()
  roadName?: string;

  @Prop()
  fullAddress?: string;

  @Prop({ default: 0 })
  confirmations!: number;

  @Prop({ default: 0 })
  denials!: number;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop()
  expiresAt?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
