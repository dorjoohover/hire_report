import { AssessmentEntity } from 'src/entities';

export class CreateExamDto {
  code?: number;
  created?: number;
  assessment?: AssessmentEntity;
  startDate: Date;
  endDate: Date;

  service: number;
}

export class FindExamByCodeDto {
  code: number;

  category?: number;
}

export class ExamUser {
  id: number[];
}

export class AdminExamDto {
  assessment: number;

  email: string;
  startDate: Date;

  endDate: Date;
}
