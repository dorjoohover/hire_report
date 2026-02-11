// import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
// import { AssessmentEntity } from './assessment.entity';
// import { FormulaEntity } from './formule.entity';
// import { QuestionCategoryEntity } from './question.category.entity';

// @Entity('assessment_formulas')
// export class AssessmentFormulaEntity {
//   @PrimaryGeneratedColumn('increment', {})
//   id?: number;

//   @ManyToOne(() => AssessmentFormulaEntity, (user) => user.id, {
//     nullable: true,
//   })
//   parent: AssessmentFormulaEntity;
//   @ManyToOne(() => FormulaEntity, (user) => user.assessment)
//   formule: FormulaEntity;
//   @ManyToOne(() => AssessmentEntity, (user) => user.formules)
//   assessment: AssessmentEntity;
//   @Column({ nullable: true })
//   type: number;
//   @ManyToOne(() => QuestionCategoryEntity, (category) => category.formulas)
//   question_category: QuestionCategoryEntity;
// }
