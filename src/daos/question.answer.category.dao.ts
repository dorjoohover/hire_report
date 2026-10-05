import { Injectable } from '@nestjs/common';
import { QuestionAnswerCategoryEntity } from 'src/entities';
import { DataSource, In, Repository } from 'typeorm';

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

  // findOne-тэй ИЖИЛ (parent relation-тэй), гэхдээ олон id-г НЭГ query-ээр —
  // FormuleDao.buildCategoryCache-д мөр тутмын findOne (N+1)-ийг орлоно.
  findByIds = async (ids: number[]) => {
    if (!ids.length) return [];
    return await this.db.find({
      where: { id: In(ids) },
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
