import { Injectable } from '@nestjs/common';
import { snapshottable } from 'src/report-data/snapshot';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { ResultEntity } from '../entities/result.entity';
import { ResultDetailEntity } from '../entities/result.detail.entity';
import { ResultDetailDto, ResultDto } from 'src/dtos/index.dto';
import { ReportType } from 'src/base/constants';

@Injectable()
export class ResultDao {
  private db: Repository<ResultEntity>;
  private detail: Repository<ResultDetailEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(ResultEntity);
    this.detail = this.dataSource.getRepository(ResultDetailEntity);
    // v1.3.0: render замын уншилтуудыг snapshot-д хамааруулна (src/report-data/snapshot.ts).
    // Snapshot context-гүй үед өөрчлөлтгүй — шууд DB.
    this.findOne = snapshottable('result.findOne', this.findOne);
    this.findChild = snapshottable('result.findChild', this.findChild);
    this.findQuartile = snapshottable('result.findQuartile', this.findQuartile);
    this.findQuartileWithTotal = snapshottable('result.findQuartileWithTotal', this.findQuartileWithTotal);
  }

  /**
   * v1.3.0: result + details-ийг НЭГ transaction-оор (дундаас тасарвал хагас result
   * үлдэхгүй), details-ийг batch INSERT-ээр (өмнө нь мөр бүрд тусдаа INSERT).
   * Эцэг (parent-гүй) result-д тухайн код дээр advisory lock + байгаа эсэхийг шалгана —
   * зэрэг ирсэн 2 тооцоолол давхар эцэг мөр үүсгэхгүй (байвал түүний id-г буцаана).
   */
  create = async (dto: ResultDto, details: ResultDetailDto[] = []) => {
    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(ResultEntity);
      if (!dto.parent && dto.code) {
        await m.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`result:${dto.code}`]);
        const existing = await repo.findOne({
          where: { code: dto.code, parent: IsNull() },
          select: { id: true },
        });
        if (existing) {
          console.warn(`⚠️ result ${dto.code} аль хэдийн байна — давхар үүсгэхгүй (id ${existing.id})`);
          return existing.id;
        }
      }
      const res = repo.create({
        ...dto,
        type: dto.type ?? ReportType.CORRECT,
        parent: dto.parent
          ? {
              id: dto.parent,
            }
          : null,
      });
      await repo.save(res);
      if (details.length) {
        const detailRepo = m.getRepository(ResultDetailEntity);
        await detailRepo.save(
          details.map((d) => detailRepo.create({ ...d, result: { id: res.id } })),
          { chunk: 200 },
        );
      }
      return res.id;
    });
  };

  /** Ops "recalculate" (v1.3.0 calc): тухайн кодын бүх result (+ дэд, details)-ийг устгана. */
  deleteByCode = async (code: string) => {
    await this.dataSource.transaction(async (m) => {
      await m.query(
        `DELETE FROM "resultDetail" WHERE "resultId" IN (SELECT id FROM result WHERE code = $1)`,
        [code],
      );
      await m.query(`DELETE FROM result WHERE code = $1 AND "parentId" IS NOT NULL`, [code]);
      await m.query(`DELETE FROM result WHERE code = $1`, [code]);
    });
  };

  findChild = async (code: string) => {
    return await this.db.find({
      where: {
        code,
        parent: Not(IsNull()),
      },
      relations: ['details'],
    });
  };
  findOne = async (code: string) => {
    return await this.db.findOne({
      where: {
        code,
      },
      relations: ['details'],
    });
  };

  findQuartile = async (assessment: number) => {
    try {
      const res = await this.db.find({
        where: {
          assessment: assessment,
          point: Not(IsNull()),
        },
        select: {
          id: true,
          point: true,
        },
        order: {
          id: 'ASC', // Sort results in ascending order
        },
      });

      return res;
    } catch (error) {
      console.log(error);
    }
  };

  findQuartileWithTotal = async (assessment: number) => {
    try {
      const res = await this.db.find({
        where: {
          assessment: assessment,
          point: Not(IsNull()),
        },
        select: {
          id: true,
          point: true,
          total: true,
        },
        order: {
          point: 'ASC', // Sort results in ascending order
        },
      });

      return res;
    } catch (error) {
      console.log(error);
      return [];
    }
  };
}
