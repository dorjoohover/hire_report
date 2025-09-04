import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { QuestionAnswerEntity } from './question.answer.entity';
import { AssessmentEntity } from './assessment.entity';
import { UserAnswerEntity } from './user.answer.entity';

@Entity('questionAnswerCategory')
export class QuestionAnswerCategoryEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column()
  name: string;
  @Column({ nullable: true })
  description: string;

  @ManyToOne(
    () => QuestionAnswerCategoryEntity,
    (category) => category.subcategories,
    {
      nullable: true,
    },
  )
  parent?: QuestionAnswerCategoryEntity;
  @ManyToOne(() => AssessmentEntity, (category) => category.answerCategories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  assessment?: AssessmentEntity;

  @OneToMany(() => QuestionAnswerCategoryEntity, (category) => category.parent)
  subcategories: QuestionAnswerCategoryEntity[];

  @OneToMany(() => QuestionAnswerEntity, (category) => category.category)
  questionAnswers: QuestionAnswerEntity[];
  @OneToMany(() => UserAnswerEntity, (user) => user.answerCategory)
  userAnswers: UserAnswerEntity[];
}
