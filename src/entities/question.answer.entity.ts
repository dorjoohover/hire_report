import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { QuestionAnswerCategoryEntity, QuestionAnswerMatrixEntity, QuestionEntity, UserAnswerEntity } from './index'

@Entity('questionAnswer')
export class QuestionAnswerEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column()
  value: string;
  @Column({ nullable: true, type: 'numeric' })
  point: number;
  @Column()
  orderNumber: number;
  @Column({ nullable: true })
  file: string;
  @Column({ default: false })
  correct: boolean;
  @Column({ default: false })
  reverse: boolean;

  @ManyToOne(() => QuestionEntity, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  question: QuestionEntity;
  @ManyToOne(
    () => QuestionAnswerCategoryEntity,
    (category) => category.questionAnswers,
    { nullable: true },
  )
  category: QuestionAnswerCategoryEntity;
  @OneToMany(() => QuestionAnswerMatrixEntity, (matrix) => matrix.answer)
  matrix: QuestionAnswerMatrixEntity[];
  @OneToMany(() => UserAnswerEntity, (userAns) => userAns.answer)
  userAnswers: UserAnswerEntity[];
}
 
