import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssessmentEntity, TransactionEntity, UserEntity } from './index';

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column()
  totalPrice: number;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column()
  method: number;
  @Column({ nullable: true })
  message: string;

  @ManyToOne(() => UserEntity, (user) => user.payments, { nullable: true })
  user: UserEntity;
  @ManyToOne(() => UserEntity, (user) => user.charges)
  charger: UserEntity;
  @ManyToOne(() => AssessmentEntity, (user) => user.payments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  assessment: AssessmentEntity;
  @OneToMany(() => TransactionEntity, (transaction) => transaction.payment, {
    nullable: true,
  })
  transactions: TransactionEntity[];
}
