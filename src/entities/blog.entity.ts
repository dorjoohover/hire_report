import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './index';

@Entity('blog')
export class BlogEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column()
  title: string;
  @Column({ nullable: true })
  image: string;
  @Column({ nullable: true })
  video: string;
  @Column()
  content: string;
  @Column({ default: 0 })
  minutes: number;

  @Column()
  category: number;

  @Column({ default: false })
  pinned: boolean;
  @CreateDateColumn()
  createdAt?: Date;
  @ManyToOne(() => UserEntity, (payment) => payment.blogs)
  user: UserEntity;
}
