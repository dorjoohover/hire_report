import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ExamDetailEntity,
  QuestionAnswerEntity,
  QuestionAnswerMatrixEntity,
  QuestionCategoryEntity,
  UserAnswerEntity,
} from './index';
@Entity('question')
export class QuestionEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column()
  name: string;
  @Column()
  type: number;
  @Column({ default: true })
  required: boolean;
  @Column()
  status: number;
  @Column({ nullable: true })
  level: number;

  @Column({ nullable: true, type: 'numeric' })
  minValue: number;
  @Column({ nullable: true, type: 'numeric' })
  maxValue: number;
  @Column({ nullable: true, type: 'numeric' })
  point: number;
  @Column()
  orderNumber: number;
  @Column({ nullable: true })
  slider: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
  @Column({ nullable: true })
  createdUser: number;
  @Column({ nullable: true })
  updatedUser: number;
  @Column({ nullable: true })
  file: string;
  @ManyToOne(() => QuestionCategoryEntity, (category) => category.questions, {
    onDelete: 'CASCADE',
  })
  category: QuestionCategoryEntity;
  @OneToMany(() => QuestionAnswerEntity, (answer) => answer.question)
  answers: QuestionAnswerEntity[];
  @OneToMany(() => QuestionAnswerMatrixEntity, (answer) => answer.question)
  matrix: QuestionAnswerMatrixEntity[];
  @OneToMany(() => ExamDetailEntity, (detail) => detail.question)
  examDetails: ExamDetailEntity[];
  @OneToMany(() => UserAnswerEntity, (userAns) => userAns.answer)
  userAnswers: UserAnswerEntity[];
}
