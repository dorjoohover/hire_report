import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { json, raw } from 'express';
import { installProcessHandlers, REPORT_ROLE } from './base/runtime';

// Нэг холболтын алдаа бүх процессыг унагаахаас сэргийлнэ (src/base/runtime.ts).
installProcessHandlers();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);
  app.setGlobalPrefix('/api/v1');
  // PUT /internal/files/:name (Ops "PDF гараар солих") — core `application/pdf`
  // Content-Type-тэй түүхий байт урсгал илгээдэг тул JSON parser-аас ӨМНӨ,
  // зөвхөн энэ замд raw body уншина; бусад route-д нөлөөгүй.
  app.use('/api/v1/internal/files', raw({ type: 'application/pdf', limit: '25mb' }));
  app.use(json({ limit: '50mb' }));
  // SIGTERM (docker stop / deploy) үед BullMQ worker-ийг close() хийж, ажиллаж буй
  // job-ыг дуусгаад гарна (compose stop_grace_period 120s). Өмнө нь hook асаагүй тул
  // процесс шууд үхэж job "stalled" болдог байв.
  app.enableShutdownHooks();
  const port = process.env.REPORT_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 hire_report HTTP :${port} (REPORT_ROLE=${REPORT_ROLE})`);
}
bootstrap();
