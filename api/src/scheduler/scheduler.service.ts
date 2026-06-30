import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { WeatherService } from '../weather/weather.service';
import { TelegramService } from '../telegram/telegram.service';
import { WeatherAlertLog, WeatherAlertLogDocument } from '../weather/schemas/weather-alert-log.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private usersService: UsersService,
    private weatherService: WeatherService,
    private telegramService: TelegramService,
    @InjectModel(WeatherAlertLog.name) private alertLogModel: Model<WeatherAlertLogDocument>,
  ) {}

  // Run automatically every hour (for production)
  // And we also support manual execution
  @Cron(CronExpression.EVERY_HOUR)
  async handleCronAlerts() {
    this.logger.log('Executing automated cron weather alerts...');
    await this.dispatchAlertsToAllUsers();
  }

  async dispatchAlertsToAllUsers() {
    // 1. Query for users: status = APPROVED and telegramChatId exists
    const users = await this.usersService.findAll({
      status: 'APPROVED',
      telegramChatId: { $exists: true, $ne: null },
    });

    this.logger.log(`Found ${users.length} approved users with linked Telegram accounts.`);
    
    const results = {
      total: users.length,
      successCount: 0,
      failCount: 0,
      details: [] as any[],
    };

    for (const user of users) {
      if (!user.telegramChatId) continue;

      try {
        // 2. Fetch current weather info based on user's registered city
        const weather = await this.weatherService.getWeather(user.location || 'New York');
        
        // 3. Format a beautiful markdown message
        const message = this.formatWeatherMessage(user.name, weather);

        // 4. Dispatch Telegram alert
        const success = await this.telegramService.sendMessage(user.telegramChatId, message);

        if (success) {
          results.successCount++;
          // Log success to DB
          await new this.alertLogModel({
            userId: user._id,
            telegramChatId: user.telegramChatId,
            status: 'SUCCESS',
            weatherDetails: weather,
          }).save();
          
          results.details.push({ email: user.email, status: 'SUCCESS' });
        } else {
          throw new Error('Telegram API dispatch failed');
        }
      } catch (err) {
        results.failCount++;
        this.logger.error(`Failed to send alert to user ${user.email}: ${err.message}`);
        
        // Log failure to DB
        await new this.alertLogModel({
          userId: user._id,
          telegramChatId: user.telegramChatId || 'unknown',
          status: 'FAILED',
          errorMessage: err.message,
        }).save();

        results.details.push({ email: user.email, status: 'FAILED', error: err.message });
      }
    }

    return results;
  }

  private formatWeatherMessage(name: string, weather: any): string {
    const { temp, condition, description, city, isMock } = weather;
    
    // Choose emoji based on weather condition
    let emoji = '☀️';
    let tip = 'Enjoy the beautiful weather!';

    const cond = condition.toLowerCase();
    if (cond.includes('rain')) {
      emoji = '🌧️';
      tip = '☔ Don\'t forget your umbrella today!';
    } else if (cond.includes('thunderstorm') || cond.includes('storm')) {
      emoji = '⛈️';
      tip = '⚡ Severe weather alert! Stay indoors and keep safe.';
    } else if (cond.includes('snow')) {
      emoji = '❄️';
      tip = '🧣 It\'s freezing! Bundle up and watch for slippery roads.';
    } else if (cond.includes('cloud')) {
      emoji = '☁️';
      tip = '🌥️ It is a bit cloudy today.';
    }

    return `
🔔 *WeatherGuard Alert* 🔔

Hello *${name}*, here is your weather update for *${city}*:

🌡️ *Temperature:* ${temp}°C
✨ *Condition:* ${emoji} ${condition} (${description})

💡 *Recommendation:* ${tip}

${isMock ? '🧪 _[Test Environment Simulator Alert]_' : ''}
    `.trim();
  }
}
