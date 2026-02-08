import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { AssessmentEntity } from './assessment.entity';
import { FormulaEntity } from './formule.entity';

@Entity('assessment_formulas')
export class AssessmentFormulaEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @ManyToOne(() => AssessmentFormulaEntity, (user) => user.id, {
    nullable: true,
  })
  parent: AssessmentFormulaEntity;
  @ManyToOne(() => FormulaEntity, (user) => user.assessment)
  formule: FormulaEntity;
  @ManyToOne(() => AssessmentEntity, (user) => user.formules)
  assessment: AssessmentEntity;
}
