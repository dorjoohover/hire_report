import { Injectable } from '@nestjs/common';
import { snapshottable } from 'src/report-data/snapshot';
import { DataSource, Repository } from 'typeorm';
import { ExamEntity } from 'src/entities';

@Injectable()
export class ExamDao {
  private db: Repository<ExamEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(ExamEntity);
    // v1.3.0: render замын уншилтуудыг snapshot-д хамааруулна (src/report-data/snapshot.ts).
    // Snapshot context-гүй үед өөрчлөлтгүй — шууд DB.
    this.findByCode = snapshottable('exam.findByCode', this.findByCode);
  }

  update = async (code: string, dto: any) => {
    const res = await this.db.findOne({ where: { code: code } });
    await this.db.save({ ...res, ...dto });
  };

  // endExam = async (code: string) => {
  //   const res = await this.db.findOne({ where: { code } });
  //   await this.db.save({ ...res, userEndDate: new Date() });
  // };

  findByCode = async (code: string) => {
    const res = await this.db.findOne({
      where: {
        code: code,
      },
      relations: ['assessment', 'user'],
    });
    return res;
  };

  query = async (q: string) => {
    return await this.db.query(q);
  };

  checkExam = async (code: string) => {
    const res = await this.query(
      `select visible from exam where code = ${code}`,
    ).then((d) => d[0]);
    return res.visible;
  };
}
