import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Same `pdf_template` table core/src/app/pdf-template/entities/pdf-template.entity.ts
// maps to (studio-ийн PDF builder). hire_report нь core-той ижил Postgres DB руу
// шууд холбогддог тул энд зөвхөн унших зорилгоор давхардуулж зарлав — schema-г
// core эзэмшинэ, энд ADD COLUMN/CREATE TABLE хийхгүй.
@Entity('pdf_template')
export class PdfTemplateEntity {
  @PrimaryGeneratedColumn('increment')
  id?: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  key?: string;

  @Column({ nullable: true })
  assessmentId?: number;

  @Column({ nullable: true })
  assessmentTypeCode?: string;

  @Column({ nullable: true })
  context?: string;

  @Column({ type: 'jsonb', nullable: true })
  content?: string[];

  @Column({ default: false })
  internalView?: boolean;

  @Column({ nullable: true })
  fontFamily?: string;

  @Column({ nullable: true })
  fontSize?: number;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  logoPosition?: string;

  @Column({ type: 'jsonb' })
  pages: any[];

  @Column({ type: 'jsonb', nullable: true })
  aiConfig?: Record<string, any>;

  @Column({ default: false })
  demoMode?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  demoData?: Record<string, any>;

  // AI Data tab-ийн JSON input feature — зөвхөн Studio preview/token эх
  // сурвалж (createPreviewPdf-д ашиглагдана, жинхэнэ generate-д биш).
  @Column({ type: 'jsonb', nullable: true })
  aiJsonData?: Record<string, any>;

  @Column({ default: false })
  isActive?: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;
}
