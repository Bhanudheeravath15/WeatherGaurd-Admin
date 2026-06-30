import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: true, default: 'USER', enum: ['USER', 'ADMIN'] })
  role: 'USER' | 'ADMIN';

  @Prop({ required: true, default: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ required: true, enum: ['google', 'github'] })
  provider: 'google' | 'github';

  @Prop({ required: true })
  providerId: string;

  @Prop({ index: true })
  telegramChatId?: string;

  @Prop()
  telegramUsername?: string;

  @Prop({ unique: true, sparse: true, index: true })
  telegramVerificationToken?: string;

  @Prop({ default: 'New York' })
  location?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
