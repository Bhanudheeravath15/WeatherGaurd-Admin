import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { TelegramModule } from './telegram/telegram.module';
import { WeatherModule } from './weather/weather.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    // Global Config module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Mongoose connection using Async options to load URI dynamically from Env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/weatherguard',
      }),
      inject: [ConfigService],
    }),

    // Enable automated cron scheduling
    ScheduleModule.forRoot(),

    // Core Domain modules
    AuthModule,
    UsersModule,
    AdminModule,
    TelegramModule,
    WeatherModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
