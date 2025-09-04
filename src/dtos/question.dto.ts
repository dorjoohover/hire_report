import { QuestionType } from 'src/base/constants';
import { CreateQuestionAnswerDto, CreateQuestionAnswerMatrixDto } from './index.dto';

export class CreateQuestionDto {
  name: string;

  type?: number;

  level?: number;
  status?: number;

  minValue: number;

  maxValue: number;

  slider: string;

  point?: number;

  orderNumber?: number;

  file?: string;
  category?: number;
  createdUser?: number;

  required: boolean;
}



export class CreateQuestionAllAnswerDto {
  answer: CreateQuestionAnswerDto;

  matrix?: CreateQuestionAnswerMatrixDto[];
}

export class CreateQuestionAllDto {
  question: CreateQuestionDto;
  answers: CreateQuestionAllAnswerDto[];

  category: number;

  type: number;

  id?: number;
}

export const ExampleDISCAllDto = {
  category: 0,
  type: QuestionType.MATRIX,
  question: {
    name: 'Q1 Та ажлын байрандаа БАЙНГА гаргадаг зөвхөн нэг зан төлөв, БАРАГ гаргадаггүй зөвхөн нэг зан төлөвийг тус тус сонгоно уу.',
    minValue: -1,
    maxValue: 1,
    orderNumber: 0,
    required: true,
  },
  answers: [
    {
      answer: {
        value: 'Байнга',
        point: 1,
        orderNumber: 0,
        category: 0,
      },
      matrix: [
        {
          value: 'Урам зоригтой /Enthusiastic/',
          category: 0,
          orderNumber: 0,
        },
        {
          value: 'Зоримог /Daring/',
          category: 1,
          orderNumber: 1,
        },
        {
          value: 'Дипломат /Diplomatic/',
          category: 2,
          orderNumber: 2,
        },
        {
          value: 'Сэтгэл ханамжтай /Satisfied/',
          category: 3,
          orderNumber: 3,
        },
      ],
    },
    {
      answer: {
        value: 'Бараг үгүй',
        point: -1,
        orderNumber: 1,
        category: 0,
      },
      matrix: [
        {
          value: 'Урам зоригтой /Enthusiastic/',
          category: 0,
          orderNumber: 0,
        },
        {
          value: 'Зоримог /Daring/',
          category: 1,
          orderNumber: 1,
        },
        {
          value: 'Дипломат /Diplomatic/',
          category: 2,
          orderNumber: 2,
        },
        {
          value: 'Сэтгэл ханамжтай /Satisfied/',
          category: 3,
          orderNumber: 3,
        },
      ],
    },
  ],
};
export const ExampleMultipleAllDto = {
  category: 0,
  type: QuestionType.MULTIPLE,
  question: {
    name: 'Q1 Та ажлын байрандаа БАЙНГА гаргадаг зөвхөн нэг зан төлөв, БАРАГ гаргадаггүй зөвхөн нэг зан төлөвийг тус тус сонгоно уу.',
    minValue: 0,
    maxValue: 1,
    required: true,
    orderNumber: 0,
  },
  answers: [
    {
      answer: {
        value: 'Байнга',
        point: 1,
        orderNumber: 0,
        category: 0,
      },
    },
    {
      answer: {
        value: 'Бараг үгүй',
        point: 0,
        orderNumber: 1,
        category: 0,
      },
    },
    {
      answer: {
        value: 'Бараг үгүй 1',
        point: 0.5,
        orderNumber: 2,
        category: 0,
      },
    },
  ],
};
export const ExampleSingleAllDto = {
  category: 0,
  type: QuestionType.SINGLE,
  question: {
    name: 'Q1 Та ажлын байрандаа БАЙНГА гаргадаг зөвхөн нэг зан төлөв, БАРАГ гаргадаггүй зөвхөн нэг зан төлөвийг тус тус сонгоно уу.',
    minValue: 0,
    maxValue: 1,
    required: true,
    orderNumber: 0,
  },
  answers: [
    {
      answer: {
        value: 'Байнга',
        point: 1,
        orderNumber: 0,
        category: 0,
        correct: true,
      },
    },
    {
      answer: {
        value: 'Бараг үгүй',
        point: 0,
        orderNumber: 1,
        category: 0,
        correct: false,
      },
    },
    {
      answer: {
        value: 'Бараг үгүй 1',
        point: 0,
        orderNumber: 2,
        category: 0,
        correct: false,
      },
    },
  ],
};
export const ExampleTrueFalseAllDto = {
  category: 0,
  type: QuestionType.TRUEFALSE,
  question: {
    name: 'Q1 Та ажлын байрандаа БАЙНГА гаргадаг зөвхөн нэг зан төлөв, БАРАГ гаргадаггүй зөвхөн нэг зан төлөвийг тус тус сонгоно уу.',
    minValue: 0,
    maxValue: 1,
    required: true,
    orderNumber: 0,
  },
  answers: [
    {
      answer: {
        value: 'Тийм',
        point: 1,
        orderNumber: 0,
        category: 0,
        correct: true,
      },
    },
    {
      answer: {
        value: 'Үгүй',
        point: 0,
        orderNumber: 1,
        category: 0,
        correct: false,
      },
    },
  ],
};
export const ExampleConstantSumAllDto = {
  category: 0,
  type: QuestionType.CONSTANTSUM,
  question: {
    name: 'Q1 Та ажлын байрандаа БАЙНГА гаргадаг зөвхөн нэг зан төлөв, БАРАГ гаргадаггүй зөвхөн нэг зан төлөвийг тус тус сонгоно уу.',
    minValue: 0,
    maxValue: 10,
    required: true,
    orderNumber: 0,
  },
  answers: [
    {
      answer: {
        value: 'Байнга',
        orderNumber: 0,
        category: 0,
      },
    },
    {
      answer: {
        value: 'Бараг үгүй',
        orderNumber: 1,
        category: 0,
      },
    },
    {
      answer: {
        value: 'Бараг үгүй 1',
        orderNumber: 2,
        category: 0,
      },
    },
  ],
};
