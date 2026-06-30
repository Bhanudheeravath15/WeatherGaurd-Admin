import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WeatherService } from './weather.service';
import { WeatherAlertLog, WeatherAlertLogSchema } from './schemas/weather-alert-log.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: WeatherAlertLog.name, schema: WeatherAlertLogSchema },
    ]),
  ],
  providers: [WeatherService],
  exports: [WeatherService, MongooseModule],
})
export class WeatherModule {}
