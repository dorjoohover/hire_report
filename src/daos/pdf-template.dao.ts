import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PdfTemplateEntity } from 'src/entities';

@Injectable()
export class PdfTemplateDao {
  private db: Repository<PdfTemplateEntity>;
  constructor(private dataSource: DataSource) {
    this.db = this.dataSource.getRepository(PdfTemplateEntity);
  }

  // Тухайн assessment дээр report generation-д ашиглах гэж studio-гоос
  // тэмдэглэсэн (isActive=true) загварыг олно. Байхгүй бол null — дуудагч тал
  // хуучин (hardcoded) renderer-ээр үргэлжлүүлнэ.
  findActiveByAssessment = async (
    assessmentId: number,
  ): Promise<PdfTemplateEntity | null> => {
    if (!assessmentId) return null;
    return await this.db.findOne({
      where: { assessmentId, isActive: true },
    });
  };
}
