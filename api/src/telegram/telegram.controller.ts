import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(
    private telegramService: TelegramService,
    private usersService: UsersService,
  ) {}

  @Get('token')
  async getTelegramToken(@Request() req) {
    const userId = req.user.sub;
    
    // Generate or get verification token
    const token = await this.usersService.generateTelegramVerificationToken(userId);
    const botUsername = await this.telegramService.getBotUsername();
    const isMock = this.telegramService.isMockMode;

    return {
      token,
      botUsername,
      deepLink: `https://t.me/${botUsername}?start=${token}`,
      isMockTelegram: isMock,
    };
  }

  @Post('simulate-link')
  async simulateLink(@Request() req, @Body('username') username: string) {
    const userId = req.user.sub;
    if (!username) {
      throw new BadRequestException('username is required');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.telegramChatId = `sim_chat_${userId}`;
    user.telegramUsername = username.trim().replace('@', '');
    user.telegramVerificationToken = undefined;
    await user.save();

    return { message: 'Telegram simulated connection established successfully', user };
  }
}
