import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);
  app.use(json({ limit: '50mb' }));
  const port = process.env.REPORT_PORT || 4040;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
