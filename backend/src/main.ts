import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config as loadEnv } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  loadEnv();
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));

  // Use process.cwd() to ensure we look for uploads in the project root
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT || 5001);
}
bootstrap();