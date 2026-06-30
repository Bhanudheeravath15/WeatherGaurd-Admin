import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { UsersModule } from '../users/users.module';
import { WeatherModule } from '../weather/weather.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UsersModule,
    WeatherModule,
    TelegramModule,
    AuthModule,
  ],
  providers: [SchedulerService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}
