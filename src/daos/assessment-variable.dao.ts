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

  // Raw "SELECT *" — entity-ийн багана (kind/rules) DB-д хараахан нэмэгдээгүй
  // (core-ийн perf-bootstrap ажиллаагүй) үед ч query унахгүй: байгаа
  // баганыг л буцаана. Өмнө нь entity-ээр SELECT хийхэд "column kind does
  // not exist" алдаа гарч, БҮХ хэрэглэгчийн хувьсагч (энгийн ч) хоосон болдог
  // байв.
  findAllByAssessmentId = async (assessmentId: number): Promise<AssessmentVariableEntity[]> => {
    if (!assessmentId) return [];
    const rows = await this.dataSource.query(
      'SELECT * FROM assessment_variable WHERE "assessmentId" = $1',
      [assessmentId],
    );
    return (rows || []).map((r: any) => ({
      ...r,
      entries: typeof r.entries === 'string' ? JSON.parse(r.entries) : r.entries,
      rules: typeof r.rules === 'string' ? JSON.parse(r.rules) : r.rules,
    }));
  };
}
