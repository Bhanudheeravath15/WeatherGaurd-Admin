import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByTelegramToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ telegramVerificationToken: token }).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    // If this is the very first user in the database, automatically make them an APPROVED ADMIN
    const count = await this.userModel.countDocuments().exec();
    if (count === 0) {
      userData.role = 'ADMIN';
      userData.status = 'APPROVED';
    } else {
      userData.role = 'USER';
      userData.status = 'PENDING';
    }
    
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async update(id: string, updateData: Partial<User>): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updated;
  }

  async generateTelegramVerificationToken(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a clean 6-digit verification code, e.g. "WG-483920"
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `WG-${randomCode}`;

    user.telegramVerificationToken = token;
    await user.save();

    return token;
  }

  async findAll(filter: any = {}): Promise<UserDocument[]> {
    return this.userModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async count(filter: any = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }
}
