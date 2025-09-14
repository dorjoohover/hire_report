import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ResultDetailEntity } from './index';

@Entity('result')
export class ResultEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column({ type: 'bigint' })
  code: number;

  @Column()
  assessmentName: string;

  @Column()
  lastname: string;

  @Column()
  firstname: string;
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => ResultDetailEntity, (userAns) => userAns.result, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  details: ResultDetailEntity[];

  @Column({ nullable: true })
  total: number;
  @Column()
  type: number;
  @Column()
  assessment: number;
  // possible duration
  @Column()
  limit: number;
  //during duration
  @Column()
  duration: number;
  @Column({ nullable: true, type: 'numeric' })
  point: number;
  // in disc (d || c || di)

  @Column({ nullable: true })
  result: string;
  @Column({ nullable: true })
  segment: string;
  // in disc (undershift | overshift)
  @Column({ nullable: true })
  value: string;
}
