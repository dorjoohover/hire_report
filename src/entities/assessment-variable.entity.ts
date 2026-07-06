import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// core/src/app/pdf-template/entities/assessment-variable.entity.ts-той ЯГ
// АДИЛ хүснэгт (assessment_variable) — core талд CRUD хийгддэг, энд зөвхөн
// УНШИХ зорилготой (dynamic-template.renderer.ts render хийхдээ exam-ийн
// assessment.id-аар татаж {{custom.<key>}} token болгоно).
@Entity('assessment_variable')
@Index(['assessmentId', 'key'], { unique: true })
export class AssessmentVariableEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column()
  assessmentId: number;

  @Column({ length: 100 })
  key: string;

  @Column({ length: 255, nullable: true })
  label?: string;

  @Column({ type: 'jsonb', nullable: true })
  entries?: Record<string, string>;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;
}
