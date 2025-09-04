import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ExamEntity, QuestionCategoryEntity, QuestionEntity, UserServiceEntity } from './index';

@Entity('examDetail')
export class ExamDetailEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column({ nullable: true })
  questionCategoryName: string;

  @ManyToOne(() => ExamEntity, (exam) => exam.details, { onDelete: 'CASCADE' })
  exam: ExamEntity;
  @ManyToOne(() => QuestionEntity, (question) => question.examDetails, {
    onDelete: 'CASCADE',
  })
  question: QuestionEntity;
  @ManyToOne(() => QuestionCategoryEntity, (category) => category.examDetails, {
    onDelete: 'CASCADE',
  })
  questionCategory: QuestionCategoryEntity;

  @ManyToOne(() => UserServiceEntity, (service) => service.exams, {
    onDelete: 'CASCADE',
  })
  service: UserServiceEntity;
}
 
