import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssessmentEntity, UserEntity } from './index';

@Entity('feedback')
export class FeedbackEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;
  @CreateDateColumn()
  createdAt?: Date;
  @Column()
  type: number;
  @Column({ nullable: true })
  message: string;
  @Column({ nullable: true })
  status: number;
  @ManyToOne(() => UserEntity, (service) => service.feedbacks)
  user: UserEntity;
  @ManyToOne(() => AssessmentEntity, (service) => service.feedbacks, {
    onDelete: 'CASCADE',
  })
  assessment: AssessmentEntity;
}
