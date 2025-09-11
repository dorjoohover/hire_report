import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { ResultEntity } from '../entities/result.entity';
import { ResultDetailEntity } from '../entities/result.detail.entity';
import { ResultDetailDto, ResultDto } from 'src/dtos/index.dto';

@Injectable()
export class ResultDao {
  private db: Repository<ResultEntity>;
  private detail: Repository<ResultDetailEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(ResultEntity);
    this.detail = this.dataSource.getRepository(ResultDetailEntity);
  }

  create = async (dto: ResultDto, details: ResultDetailDto[] = []) => {
    const res = this.db.create({
      code: dto.code,
      assessmentName: dto.assessmentName,
      lastname: dto.lastname,
      firstname: dto.firstname,
      total: dto.total,
      type: dto.type,
      assessment: dto.assessment,
      duration: dto.duration,
      point: dto.point,
      value: dto.value,
      segment: dto.segment,
    });
    await this.db.save(res);
    for (const detail of details) {
      const d = this.detail.create({ ...detail, result: { id: res.id } });
      await this.detail.save(d);
    }

    return res.id;
  };

  findOne = async (code: number) => {
    return await this.db.findOne({
      where: {
        code,
      },
      relations: ['details'],
    });
  };

  findQuartile = async (assessment: number) => {
    const res = await this.db.find({
      where: {
        assessment: assessment,
        point: Not(IsNull()),
      },
      select: {
        point: true,
      },
      order: {
        point: 'ASC', // Sort results in ascending order
      },
    });

    return res.map((r) => r.point);
  };
}
