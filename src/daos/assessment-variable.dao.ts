import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssessmentVariableEntity } from 'src/entities';

// Studio-ийн "Хэрэглэгчийн variable"-ыг УНШИХ (CRUD нь core талд хийгддэг).
// dynamic-template.renderer.ts render хийхдээ exam.assessment.id-аар татаж
// {{custom.<key>}} token болгоно (result.result-оор entries дотроос сонгоно).
@Injectable()
export class AssessmentVariableDao {
  private db: Repository<AssessmentVariableEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(AssessmentVariableEntity);
  }

  findAllByAssessmentId = async (assessmentId: number) => {
    if (!assessmentId) return [];
    return await this.db.find({ where: { assessmentId } });
  };
}
