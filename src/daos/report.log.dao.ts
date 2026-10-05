import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReportLogEntity } from 'src/entities/report.log.entity';
import { ReportLogDto } from 'src/dtos/report.log.dto';

@Injectable()
export class ReportLogDao {
  private db: Repository<ReportLogEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(ReportLogEntity);
  }

  /**
   * Шинэ мөр. ⚠️ `save()` биш `insert()` — id давхцвал (жиш нь Redis-ийн job тоологч дахин эхэлсэн)
   * хуучин тайлангийн мөрийг чимээгүй ДАРЖ БИЧИХГҮЙ, PK алдаа өгнө.
   */
  public async create(dto: ReportLogDto) {
    const log = this.db.create(dto);
    await this.db.insert(log);
    return log;
  }

  public async getById(id: string) {
    return await this.db.findOne({
      where: {
        id,
      },
    });
  }

  public async getByCode(code: string) {
    return await this.db.findOne({ where: { code } });
  }

  public async getOne(id: string) {
    return await this.db.findOne({
      where: [
        {
          id,
        },
        { code: id },
      ],
    });
  }
  async updateById(id: string, dto: Partial<ReportLogDto>) {
    const result = await this.db.update({ id }, dto);
    if (result.affected === 0) {
      throw new Error(`ReportLog with id ${id} not found`);
    }
  }

  /**
   * v1.3.0: report_logs мөрийг хэсэгчлэн шинэчлэх (calc role — DB-тэй). timings (jsonb) нь
   * НЭМЭГДЭНЭ (merge). `timings` багана байхгүй (core DDL ажиллаагүй) бол түүнгүйгээр дахин.
   */
  async patch(
    id: string,
    p: { status?: string; progress?: number; error?: string | null; timings?: Record<string, number> },
  ): Promise<void> {
    const params = [id, p.status ?? null, p.progress ?? null, p.error === undefined ? '__keep__' : p.error];
    const base = `status = COALESCE($2, status),
         progress = COALESCE($3, progress),
         error = CASE WHEN $4 = '__keep__' THEN error ELSE $4 END,
         "updatedAt" = now()`;
    try {
      await this.dataSource.query(
        `UPDATE report_logs SET ${base}, timings = COALESCE(timings, '{}'::jsonb) || $5::jsonb WHERE id = $1`,
        [...params, JSON.stringify(p.timings ?? {})],
      );
    } catch (e: any) {
      if (e?.code !== '42703') throw e; // undefined_column → timings-гүй
      await this.dataSource.query(`UPDATE report_logs SET ${base} WHERE id = $1`, params);
    }
  }

  async updateByCode(code: string, dto: Partial<ReportLogDto>) {
    const result = await this.db.update({ code }, dto);

    if (result.affected === 0) {
      throw new Error(`ReportLog with code ${code} not found`);
    }
  }
}
