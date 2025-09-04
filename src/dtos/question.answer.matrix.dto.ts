export class CreateQuestionAnswerMatrixDto {
  value: string;

  point: number;

  orderNumber: number;

  question: number;

  category: number | string;

  answer: number;
  id?: number;
}
