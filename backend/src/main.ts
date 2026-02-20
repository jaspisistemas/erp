import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = process.env.PORT ?? 3456;
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : ['http://localhost:3457', 'http://127.0.0.1:3457'],
    credentials: true,
  });
  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
