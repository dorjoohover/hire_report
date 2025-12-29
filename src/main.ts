import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);
  const port = process.env.REPORT_PORT || 4000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
