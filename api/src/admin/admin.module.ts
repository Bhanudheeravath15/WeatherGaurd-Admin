import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WeatherAlertLog, WeatherAlertLogSchema } from '../weather/schemas/weather-alert-log.schema';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: WeatherAlertLog.name, schema: WeatherAlertLogSchema },
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
