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
  AssessmentCategoryEntity,
  ExamEntity,
  LevelEntity,
  PaymentEntity,
  QuestionAnswerCategoryEntity,
  QuestionCategoryEntity,
  UserServiceEntity,
  FeedbackEntity,
} from './index';

@Entity('assessment')
export class AssessmentEntity {
  @PrimaryGeneratedColumn('increment', {})
  id?: number;

  @Column({ unique: true })
  name: string;
  @Column()
  description: string;
  @Column()
  usage: string;
  @Column()
  measure: string;
  @Column()
  price: number;
  @Column({ nullable: true })
  exampleReport: string;
  @Column({ nullable: true })
  status: number;
  @Column({ nullable: true })
  classificationCode: string;
  @Column({ default: false })
  timeout: boolean;
  @Column()
  duration: number;
  @Column({ nullable: true })
  icons: string;
  @Column({ nullable: true })
  author: string;
  @Column({ nullable: true })
  formule: number;
  @Column({ nullable: true })
  advice: string;
  @Column()
  questionCount: number;
  @Column({ default: false })
  questionShuffle: boolean;
  @Column({ default: false })
  categoryShuffle: boolean;
  @Column({ default: false })
  answerShuffle: boolean;
  @Column({ nullable: true })
  page: number;

  @Column({ nullable: true })
  totalPoint: number;

  @Column()
  type: number;
  @Column({ nullable: true })
  report: number;
  @Column({ nullable: true, default: false })
  partialScore: boolean;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column()
  createdUser: number;
  @Column({ nullable: true })
  updatedUser: number;
  @ManyToOne(() => AssessmentCategoryEntity, (category) => category.assessments)
  category: AssessmentCategoryEntity;

  @ManyToOne(() => LevelEntity, (level) => level.assessments, {
    nullable: true,
  })
  level: LevelEntity;
  @OneToMany(() => QuestionCategoryEntity, (question) => question.assessment, {
    nullable: true,
  })
  questionCategories: QuestionCategoryEntity[];
  @OneToMany(
    () => QuestionAnswerCategoryEntity,
    (question) => question.assessment,
    {
      nullable: true,
    },
  )
  answerCategories: QuestionAnswerCategoryEntity[];
  @OneToMany(() => PaymentEntity, (question) => question.assessment, {
    nullable: true,
  })
  payments: PaymentEntity[];
  @OneToMany(() => ExamEntity, (question) => question.assessment, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  exams: ExamEntity[];
  @OneToMany(() => UserServiceEntity, (service) => service.assessment, {
    nullable: true,
  })
  services: UserServiceEntity[];
  @OneToMany(() => FeedbackEntity, (service) => service.assessment, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  feedbacks: FeedbackEntity[];
}
