import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);
  app.setGlobalPrefix('/api/v1');
  // PUT /internal/files/:name (Ops "PDF гараар солих") — core `application/pdf`
  // Content-Type-тэй түүхий байт урсгал илгээдэг тул JSON parser-аас ӨМНӨ,
  // зөвхөн энэ замд raw body уншина; бусад route-д нөлөөгүй.
  app.use('/api/v1/internal/files', raw({ type: 'application/pdf', limit: '25mb' }));
  app.use(json({ limit: '50mb' }));
  const port = process.env.REPORT_PORT || 4000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
