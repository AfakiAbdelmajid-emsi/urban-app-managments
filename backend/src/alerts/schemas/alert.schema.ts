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

  @Prop({ default: 0 })
  confidenceScore!: number;

  @Prop({ type: [String], default: [] })
  confirmedBy!: string[];

  @Prop({ type: [String], default: [] })
  deniedBy!: string[];

  @Prop({ default: false })
  verified!: boolean;

  @Prop({
    type: String,
    enum: ['ACTIVE', 'VERIFIED', 'REJECTED', 'EXPIRED'],
    default: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop()
  expiresAt?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
