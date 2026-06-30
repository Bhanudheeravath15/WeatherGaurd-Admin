import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  public isMockMode = false;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN' || token === '') {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Running in Mock Telegram Mode.');
      this.isMockMode = true;
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupHandlers();
      
      // Launch bot asynchronously and catch errors (e.g. invalid token)
      this.bot.launch().then(() => {
        this.logger.log('Telegram Bot successfully launched and listening.');
      }).catch((err) => {
        this.logger.error(`Failed to launch Telegram Bot: ${err.message}`);
        this.logger.warn('Switching to Mock Telegram Mode.');
        this.isMockMode = true;
      });
    } catch (err) {
      this.logger.error(`Error initializing Telegraf: ${err.message}`);
      this.isMockMode = true;
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGINT');
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    // Handle /start command, specifically looking for deep link parameters like "/start WG-123456"
    this.bot.start(async (ctx) => {
      const payload = ctx.payload; // Extracts the parameter after /start
      
      if (!payload) {
        await ctx.reply(
          'Welcome to WeatherGuard! To link your account, please click the "Link Telegram" button in your dashboard web interface.'
        );
        return;
      }

      try {
        const user = await this.usersService.findByTelegramToken(payload);
        if (!user) {
          await ctx.reply('❌ Invalid or expired verification token. Please refresh your dashboard and try again.');
          return;
        }

        // Link user to Telegram
        user.telegramChatId = ctx.chat.id.toString();
        user.telegramUsername = ctx.from.username || ctx.from.first_name || 'Anonymous';
        user.telegramVerificationToken = undefined; // Clear token after use
        await user.save();

        await ctx.reply(`✅ Successfully linked Telegram to your account (${user.email})!`);

        if (user.status === 'APPROVED') {
          await ctx.reply('☀️ WeatherGuard alerts are active. You will receive weather updates regularly.');
        } else {
          await ctx.reply('⏳ Your account is currently pending admin approval. Once approved, weather alerts will be pushed here.');
        }
      } catch (err) {
        this.logger.error(`Error during telegram start command: ${err.message}`);
        await ctx.reply('❌ An error occurred while linking your account. Please try again later.');
      }
    });

    // Simple status checker command
    this.bot.command('status', async (ctx) => {
      try {
        const chatId = ctx.chat.id.toString();
        const user = await this.usersService.findAll({ telegramChatId: chatId });
        if (user && user.length > 0) {
          await ctx.reply(`✅ Linked to account: ${user[0].email}\nApproval Status: ${user[0].status}`);
        } else {
          await ctx.reply('❌ This chat is not linked to any WeatherGuard account.');
        }
      } catch (err) {
        await ctx.reply('❌ Error checking status.');
      }
    });

    // Catch errors in bot polling
    this.bot.catch((err: any, ctx) => {
      this.logger.error(`Telegraf error for updates: ${err.message}`);
    });
  }

  /**
   * Sends a message to a specific Telegram chat.
   * If in mock mode, it will simulate sending the message.
   */
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (this.isMockMode) {
      this.logger.log(`[MOCK TELEGRAM ALERT] Sending to Chat ID ${chatId}: \n${message}`);
      return true;
    }

    if (!this.bot) {
      this.logger.error('Cannot send message: Telegraf bot is not initialized');
      return false;
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send Telegram message to ${chatId}: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper to fetch the bot's user details (for deep links)
   */
  async getBotUsername(): Promise<string> {
    if (this.isMockMode || !this.bot) {
      return this.configService.get<string>('TELEGRAM_BOT_USERNAME') || 'MockWeatherGuardBot';
    }
    try {
      const botInfo = await this.bot.telegram.getMe();
      return botInfo.username;
    } catch {
      return this.configService.get<string>('TELEGRAM_BOT_USERNAME') || 'WeatherGuardBot';
    }
  }
}
