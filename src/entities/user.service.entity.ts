import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  AssessmentEntity,
  ExamEntity,
  TransactionEntity,
  UserEntity,
} from './index';

@Entity('userService')
export class UserServiceEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column()
  price: number;

  @Column()
  count: number;
  @Column()
  usedUserCount: number;

  @Column({ nullable: true })
  status: number;

  @ManyToOne(() => UserEntity, (user) => user.services)
  user: UserEntity;
  @ManyToOne(() => AssessmentEntity, (assessment) => assessment.services, {
    onDelete: 'CASCADE',
  })
  assessment: AssessmentEntity;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => ExamEntity, (exam) => exam.service, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  exams: ExamEntity[];
  @OneToMany(() => TransactionEntity, (transaction) => transaction.service, {
    nullable: true,
  })
  transactions: TransactionEntity[];
}
