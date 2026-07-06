import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssessmentEntity } from 'src/entities';

@Injectable()
export class AssessmentDao {
  private db: Repository<AssessmentEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(AssessmentEntity);
  }

  // Studio-ийн "PDF-ээр урьдчилан харах" (demo preview) — template.assessmentId
  // тавигдсан үед {{assessment.name}}/author/description зэргийг ЖИНХЭНЭ
  // assessment-аас татаж харуулахад ашиглана (харин exam/result өгөгдөл нь
  // demo хэвээрээ).
  findOne = async (id: number): Promise<AssessmentEntity | null> => {
    if (!id) return null;
    return await this.db.findOne({ where: { id } });
  };
}
