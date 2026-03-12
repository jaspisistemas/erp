import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = process.env.PORT ?? 3456;

  const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : null;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (configuredOrigins) {
        callback(null, configuredOrigins.includes(origin));
        return;
      }

      callback(null, true);
    },
    credentials: true,
  });
  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
