import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🔥 WORKER BOOTSTRAP');
  const app = await NestFactory.createApplicationContext(AppModule);
}
bootstrap();
