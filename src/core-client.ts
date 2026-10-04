import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

/*
 * hire_report → core дотоод дуудлагууд (v1.3.0). `INTERNAL_API_KEY` (x-internal-key),
 * core-ийн хаяг `CORE` (жиш: http://core:5000/ эсвэл https://api.hire.mn/).
 *   - status(): report_logs-ийг core шинэчилнэ (render role DB-гүй үед)
 *   - data():   snapshot miss — core → calc service (core VPS) ижил DAO-г ажиллуулна
 *   - mail():   тайлан дууссаны мэйл (хуучин урсгалтай ижил)
 */
export interface StatusPatch {
  logId: string;
  code: string;
  status?: string;
  progress?: number;
  error?: string | null;
  timings?: Record<string, number>;
}

@Injectable()
export class CoreClient {
  private readonly base = `${(process.env.CORE ?? '').replace(/\/+$/, '')}/api/v1`;
  // Хуучин кодтой ижил (core-ийн дотоод хаяг зарим орчинд self-signed байж болно).
  private readonly agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

  configured(): boolean {
    return !!process.env.CORE;
  }

  private headers() {
    return process.env.INTERNAL_API_KEY ? { 'x-internal-key': process.env.INTERNAL_API_KEY } : {};
  }

  /** Төлөв шинэчлэх. attempts удаа оролдоно; эцэст нь амжилтгүй бол false (job-ийг унагаахгүй). */
  async status(patch: StatusPatch, attempts = 3): Promise<boolean> {
    for (let i = 1; i <= attempts; i++) {
      try {
        await axios.patch(`${this.base}/report/internal/status`, patch, {
          headers: this.headers(),
          httpsAgent: this.agent,
          timeout: 10_000,
        });
        return true;
      } catch (e: any) {
        console.warn(
          `⚠️ core status (${i}/${attempts}) ${patch.code} ${patch.status ?? ''}:`,
          e?.response?.status ?? e?.code ?? e?.message,
        );
        if (i < attempts) await new Promise((r) => setTimeout(r, i * 1000));
      }
    }
    return false;
  }

  /** Snapshot miss-ийг core-оор дамжуулж calc service-ээс авна. */
  async data(name: string, args: unknown[]): Promise<unknown> {
    const res = await axios.post(
      `${this.base}/report/internal/data`,
      { name, args },
      { headers: this.headers(), httpsAgent: this.agent, timeout: 30_000 },
    );
    return res.data?.value ?? res.data?.payload?.value;
  }

  async mail(code: string): Promise<void> {
    await axios.get(`${this.base}/report/mail/${code}`, {
      headers: this.headers(),
      httpsAgent: this.agent,
      timeout: 15_000,
    });
  }
}
