import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  ExamEntity,
  QuestionAnswerCategoryEntity,
  QuestionAnswerEntity,
  QuestionAnswerMatrixEntity,
  QuestionCategoryEntity,
  QuestionEntity,
} from './index';

@Entity('userAnswer')
export class UserAnswerEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  //   token|code|url|sequence
  @Column({ nullable: true })
  ip: string;
  @Column({ nullable: true })
  correct: boolean;
  @Column({ nullable: true })
  device: string;
  @Column({ nullable: true, type: 'numeric' })
  point: number;
  @Column({ nullable: true })
  value: string;
  @Column({ nullable: true })
  flag: boolean;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @ManyToOne(() => ExamEntity, (exam) => exam.userAnswers, {
    onDelete: 'CASCADE',
  })
  exam: ExamEntity;
  @Column({ nullable: true })
  code: string;
  @ManyToOne(() => QuestionEntity, (exam) => exam.userAnswers, {
    onDelete: 'CASCADE',
  })
  question: QuestionEntity;
  @ManyToOne(
    () => QuestionAnswerCategoryEntity,
    (category) => category.userAnswers,

    {
      nullable: true,
      onDelete: 'CASCADE',
    },
  )
  answerCategory: QuestionAnswerCategoryEntity;
  @ManyToOne(() => QuestionCategoryEntity, (category) => category.userAnswers, {
    onDelete: 'CASCADE',
  })
  questionCategory: QuestionCategoryEntity;

  @ManyToOne(() => QuestionAnswerEntity, (exam) => exam.userAnswers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  answer: QuestionAnswerEntity;
  @ManyToOne(() => QuestionAnswerMatrixEntity, (exam) => exam.userAnswers, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  matrix: QuestionAnswerMatrixEntity;
}
