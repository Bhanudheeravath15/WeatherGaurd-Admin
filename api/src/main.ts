import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
    try {
      console.log('🌐 Starting automatic in-memory MongoDB database server...');
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '5.0.22',
        }
      });
      const mongoUri = mongoServer.getUri();
      process.env.MONGODB_URI = mongoUri;
      console.log(`✅ In-memory MongoDB running at: ${mongoUri}`);
    } catch (err) {
      console.error('❌ Failed to start in-memory MongoDB database:', err);
    }
  }

  const app = await NestFactory.create(AppModule);

  // Enable Global Route Prefix
  app.setGlobalPrefix('api');

  // Enable CORS for frontend cross-origin requests
  app.enableCors({
    origin: true, // Allow all origins for local development simplicity, or specify client URL
    credentials: true,
  });

  // Enable request payload validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 WeatherGuard API running on: http://localhost:${port}/api`);
}
bootstrap();
