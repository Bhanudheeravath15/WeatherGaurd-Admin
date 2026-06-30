import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherAlertLog, WeatherAlertLogDocument } from '../weather/schemas/weather-alert-log.schema';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    @InjectModel(WeatherAlertLog.name) private alertLogModel: Model<WeatherAlertLogDocument>,
  ) {}

  async getAllUsers(status?: string) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    return this.usersService.findAll(filter);
  }

  async approveUser(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Update status to APPROVED
    user.status = 'APPROVED';
    await user.save();
    return user;
  }

  async rejectUser(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = 'REJECTED';
    await user.save();
    return user;
  }

  async getDashboardMetrics() {
    const totalUsers = await this.usersService.count();
    const pendingUsers = await this.usersService.count({ status: 'PENDING' });
    const approvedUsers = await this.usersService.count({ status: 'APPROVED' });
    
    // Connected telegram bots (users who are approved and have a chatId set)
    const connectedBots = await this.usersService.count({
      telegramChatId: { $exists: true, $ne: null }
    });

    const totalAlertsSent = await this.alertLogModel.countDocuments({ status: 'SUCCESS' }).exec();

    // Fetch the 5 most recent alerts sent
    const recentAlerts = await this.alertLogModel
      .find()
      .populate('userId', 'name email avatarUrl')
      .sort({ sentAt: -1 })
      .limit(5)
      .exec();

    return {
      metrics: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        connectedBots,
        totalAlertsSent,
      },
      recentAlerts,
    };
  }
}
