import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private configService: ConfigService) {}

  async getWeather(location: string = 'New York'): Promise<{
    temp: number;
    condition: string;
    description: string;
    city: string;
    isMock: boolean;
  }> {
    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');

    if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY' || apiKey === '') {
      // Generate clean mock weather alerts for testing
      const mocks = [
        { temp: 24, condition: 'Clear', description: 'Sunny sky with light breeze' },
        { temp: 14, condition: 'Rain', description: 'Heavy rain alerts! Carry an umbrella' },
        { temp: 29, condition: 'Thunderstorm', description: 'Severe thunderstorm warnings in area' },
        { temp: 18, condition: 'Clouds', description: 'Overcast clouds, pleasant day' },
        { temp: -3, condition: 'Snow', description: 'Sub-zero temperatures and snowy roads' },
      ];
      
      const selected = mocks[Math.floor(Math.random() * mocks.length)];
      return {
        ...selected,
        city: `${location} (Mocked)`,
        isMock: true,
      };
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );
      const data = response.data;
      return {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        city: data.name,
        isMock: false,
      };
    } catch (err) {
      this.logger.error(`OpenWeather API failed: ${err.message}. Falling back to mock.`);
      return {
        temp: 15,
        condition: 'Clouds',
        description: 'scattered clouds',
        city: `${location} (Fallback)`,
        isMock: true,
      };
    }
  }
}
