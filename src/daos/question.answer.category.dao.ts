import { Injectable } from '@nestjs/common';
import { QuestionAnswerCategoryEntity } from 'src/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class QuestionAnswerCategoryDao {
  private db: Repository<QuestionAnswerCategoryEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(QuestionAnswerCategoryEntity);
  }
  findOne = async (id: number) => {
    return await this.db.findOne({
      where: {
        id: id,
      },
      relations: ['parent'],
    });
  };

  findByAssessmentId = async (assessmentId: number) => {
    return await this.db.find({
      where: {
        assessment: {
          id: assessmentId,
        },
      },
      select: ['id', 'name'],
    });
  };
}
