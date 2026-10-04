import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DB_DISABLED } from '../base/runtime';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })], // Load environment variables
  providers: [
    {
      provide: DataSource,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        try {
          const dataSource = new DataSource({
            type: 'postgres',
            url: configService.get<string>('DATABASE_URL'), // Load from .env
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: false,
            extra: {
              max: Number(process.env.DB_POOL_MAX ?? 15),
              idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS ?? 30000),
              connectionTimeoutMillis: Number(
                process.env.DB_CONN_TIMEOUT_MS ?? 30000,
              ),
              keepAlive: true,
              // ⚠️ 60000 (1мин) хэт хатуу байсныг ачаалалтай vед (report-1, job 7026)
              // "Query read timeout" алдаагаар нотлогдов — 60сек дотор хариу ирээгvй ч
              // энгийн нэг мөр UPDATE байсан тул query vнэндээ хугацаандаа биелэх байсан,
              // зөвхөн pgbouncer/Postgres ачааллын vед дараалалд удаж хариу ирсэн байх
              // магадлалтай. Бодит гацсан холболтыг барих (10мин хэтэрхий удаан) БОЛОН
              // ачаалалтай vеийн хууль ёсны удаашралыг тэвчих хоёрын дундаж болгож 3мин
              // болгов.
              statement_timeout: Number(
                process.env.DB_STATEMENT_TIMEOUT_MS ?? 180000,
              ),
              query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS ?? 180000),
            },
          });

          if (DB_DISABLED) {
            // v1.3.0 render role (DATABASE_URL байхгүй): холболтгүй, зөвхөн entity metadata —
            // DAO-ууд getRepository() хийж чадна, харин query хийвэл алдаа өгнө (snapshot
            // горимд DB-д хандах ёсгүй тул энэ нь санамсаргүй DB хандалтыг илрүүлнэ).
            await (dataSource as any).buildMetadatas();
            console.log('🛈 DB-гүй горим (REPORT_ROLE=render, DATABASE_URL байхгүй) — metadata л ачааллаа');
            return dataSource;
          }
          await dataSource.initialize();
          console.log('✅ Database Connected Successfully');
          return dataSource;
        } catch (error) {
          console.error('❌ Database Connection Error:', error);
          throw error;
        }
      },
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
