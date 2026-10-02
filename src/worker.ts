import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { installProcessHandlers, REPORT_ROLE } from './base/runtime';

// Зөвхөн BullMQ worker (HTTP-гүй). Ажиллуулах: `npm run start:worker`
// (= node dist/src/worker.js), REPORT_ROLE=worker. ops/report-vps/docker-compose.yml-ийн
// `report-worker` service үүнийг ашиглана; HTTP-г `report` (REPORT_ROLE=api) хариуцна.
installProcessHandlers();

async function bootstrap() {
  if (REPORT_ROLE === 'api') {
    console.warn(
      '⚠️ worker.ts REPORT_ROLE=api-тай ажиллаж байна — job авахгүй. REPORT_ROLE=worker тавь.',
    );
  }
  const app = await NestFactory.createApplicationContext(AppModule);
  // SIGTERM → @nestjs/bullmq worker.close() → идэвхтэй job дуусахыг хүлээнэ.
  app.enableShutdownHooks();
  console.log(`🔥 hire_report WORKER started (REPORT_ROLE=${REPORT_ROLE}, pid ${process.pid})`);
}
bootstrap().catch((err) => {
  console.error('❌ worker bootstrap failed:', err);
  process.exit(1);
});
