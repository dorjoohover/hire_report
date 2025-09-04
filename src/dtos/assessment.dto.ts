import { CreateQuestionAnswerCategoryDto } from "./index.dto";

export class CreateAssessmentDto {
  name: string;

  description: string;

  measure: string;

  usage: string;

  duration: number;

  status: number;

  timeout: boolean;

  price: number;

  formule?: number;

  advice?: string;

  author?: string;

  type?: number;

  report?: number;

  exampleReport?: string;

  questionShuffle?: boolean;

  answerShuffle?: boolean;

  categoryShuffle?: boolean;

  questionCount?: number;
  createdUser: number;

  level: any;

  category: number;

  icons?: string;
  answerCategories?: CreateQuestionAnswerCategoryDto[];
}
