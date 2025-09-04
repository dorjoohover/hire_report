export class CreateQuestionAnswerDto {
  value: string;

  point?: number;

  orderNumber: number;

  file?: string;

  question: number;

  correct: boolean;

  reverse?: boolean;

  id?: number;

  category?: number | string;
}

export class UpdateQuestionAnswersDto {
  question: number;
  answers: CreateQuestionAnswerDto[];
}
