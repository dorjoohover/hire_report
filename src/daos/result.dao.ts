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
      ...dto,
      parent: dto.parent
        ? {
            id: dto.parent,
          }
        : null,
    });
    await this.db.save(res);
    for (const detail of details) {
      console.log('detail', detail);
      const d = this.detail.create({ ...detail, result: { id: res.id } });
      await this.detail.save(d);
    }

    return res.id;
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
