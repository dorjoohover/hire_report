import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { json, raw } from 'express';

// Report worker их ачааллын үед (DB connection timeout гэх мэт) НЭГ ч холболтын
// алдаа бvх процессыг унагаахаас сэргийлнэ — тухайн job амжилтгvй болоод (BullMQ
// attempts:3-аар retry хийгдэнэ), бусад бvгд хэвийн vргэлжилнэ.
process.on('unhandledRejection', (err) => {
  console.error('🔴 UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('🔴 UNCAUGHT EXCEPTION:', err);
});

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
