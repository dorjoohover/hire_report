import { Injectable } from '@nestjs/common';
import { snapshottable } from 'src/report-data/snapshot';
import { QuestionAnswerCategoryEntity } from 'src/entities';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class QuestionAnswerCategoryDao {
  private db: Repository<QuestionAnswerCategoryEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(QuestionAnswerCategoryEntity);
    // v1.3.0: render замын уншилтуудыг snapshot-д хамааруулна (src/report-data/snapshot.ts).
    // Snapshot context-гүй үед өөрчлөлтгүй — шууд DB.
    this.findByAssessmentId = snapshottable('qac.findByAssessmentId', this.findByAssessmentId);
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
