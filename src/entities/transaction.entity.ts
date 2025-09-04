import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentEntity, UserServiceEntity } from './index';

@Entity('transaction')
export class TransactionEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column({ nullable: true })
  price: number;

  @Column({ nullable: true })
  count: number;

  @CreateDateColumn()
  createdAt: Date;
  @ManyToOne(() => PaymentEntity, (exam) => exam.transactions, {
    nullable: true,
  })
  payment: PaymentEntity;
  @ManyToOne(() => UserServiceEntity, (service) => service.transactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  service: UserServiceEntity;
  @Column()
  createdUser: number;
}
