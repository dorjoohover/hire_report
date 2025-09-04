class UserAnswer {
  answer: number;

  point?: number;

  matrix?: number;

  value?: string;
}
export class CreateUserAnswerDto {
  ip: string;
  device: string;
  value?: string;
  startDate: Date;
  maxPoint: number;
  minPoint: number;
  answers: UserAnswer[];
  answer?: number;
  point?: number;

  flag: boolean;

  code: number;
  matrix?: number;
  exam?: number;

  question: number;

  answerCategory: number;

  questionCategory: number;
  correct: boolean;
}

export class UserAnswerDtoList {
  data: CreateUserAnswerDto[];
  startDate: Date;

  end: boolean;
}
export class CalculateUserAnswerDto {
  question: number;
  matrix: number;
  answerCategory: boolean;
  questionCategory: boolean;
  point: number;
  answer: number;
}
