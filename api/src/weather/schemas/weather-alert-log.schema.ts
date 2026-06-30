import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeatherAlertLogDocument = WeatherAlertLog & Document;

@Schema({ timestamps: true })
export class WeatherAlertLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  telegramChatId: string;

  @Prop({ required: true, enum: ['SUCCESS', 'FAILED'] })
  status: 'SUCCESS' | 'FAILED';

  @Prop({ type: Object })
  weatherDetails?: any;

  @Prop({ default: Date.now })
  sentAt: Date;

  @Prop()
  errorMessage?: string;
}

export const WeatherAlertLogSchema = SchemaFactory.createForClass(WeatherAlertLog);
