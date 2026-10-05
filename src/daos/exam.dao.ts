import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ExamEntity } from 'src/entities';

@Injectable()
export class ExamDao {
  private db: Repository<ExamEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(ExamEntity);
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
