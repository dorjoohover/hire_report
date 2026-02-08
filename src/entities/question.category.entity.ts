import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssessmentEntity } from './assessment.entity';
import { ExamDetailEntity } from './exam.detail.entity';
import { QuestionEntity } from './question.entity';
import { UserAnswerEntity } from './user.answer.entity';
import { QuestionCategoryType } from 'src/base/constants';
import { AssessmentFormulaEntity } from './assessment.formule.entity';

@Entity('questionCategory')
export class QuestionCategoryEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column()
  name: string;
  @Column({ nullable: true })
  value: string;
  @Column({ type: 'numeric', nullable: true })
  totalPoint: number;
  @Column({ nullable: true })
  duration: number;
  @Column({ default: false })
  sliced: boolean;

  @Column({ nullable: true })
  orderNumber: number;
  // ene category heden asuult avch baigag haruulna
  @Column()
  questionCount: number;
  @Column({ default: QuestionCategoryType.CATEGORY })
  type: number;
  @Column({ nullable: true })
  url?: string;
  @Column()
  status: number;
  @Column({ type: 'boolean', default: true })
  is_calculated: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
  @Column()
  createdUser: number;
  @Column({ nullable: true })
  updatedUser: number;
  @ManyToOne(
    () => AssessmentEntity,
    (assessment) => assessment.questionCategories,
    { onDelete: 'CASCADE' },
  )
  assessment: AssessmentEntity;
  @OneToMany(() => QuestionEntity, (question) => question.category, {
    nullable: true,
  })
  questions: QuestionEntity[];

  @OneToMany(() => ExamDetailEntity, (detail) => detail.questionCategory)
  examDetails: ExamDetailEntity[];
  @OneToMany(() => UserAnswerEntity, (user) => user.questionCategory)
  userAnswers: UserAnswerEntity[];
  @OneToMany(
    () => AssessmentFormulaEntity,
    (formula) => formula.question_category,
  )
  formulas: AssessmentFormulaEntity[];
}
