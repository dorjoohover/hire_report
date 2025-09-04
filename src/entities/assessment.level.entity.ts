import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { AssessmentEntity } from './assessment.entity';

@Entity('assessmentLevel')
export class LevelEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column({ unique: true })
  name: string;
  @Column()
  description: string;

  @OneToMany(() => AssessmentEntity, (assessment) => assessment.level, {
    nullable: true,
  })
  assessments: AssessmentEntity[];
}
