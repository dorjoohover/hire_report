export const ReportType = {
  CORRECT: 10,
  CORRECTCOUNT: 11,
  DISC: 20,
  MBTI: 30,
  BELBIN: 40,
  GENOS: 50,
  NARC: 60,
  SETGEL: 70,
  EMPATHY: 80,
  DARKTRIAD: 90,
  HOLLAND: 100,
  BURNOUT: 110,
  BIGFIVE: 120,
  DISAGREEMENT: 130,
};
export const QuestionCategoryType = {
  QUESTION: 10,
  CATEGORY: 20,
};

export const AssessmentStatus = {
  ACTIVE: 10,
  ARCHIVE: 20,
  HIGHLIGHTED: 30,
};

export interface Meta {
  count: number;
  total: number;
  page: number;
  limit: number;
  items?: any[];
}

export const QuestionStatus = {
  ACTIVE: 10,
  DELETED: 20,
  PASSIVE: 30,
};

export const QuestionType = {
  SINGLE: 10,
  MULTIPLE: 20,
  TRUEFALSE: 30,
  MATRIX: 40,
  CONSTANTSUM: 50,
  SLIDER: 60,
};

export const AssessmentType = {
  TEST: 10,
  UNELGEE: 20,
};
export const SUPER_ADMIN = 10;
// baiguullagiin mongo nemeh bolomjtoi
export const ADMIN = 40;
// zowhon test nemeh bolomjtoi
export const TESTER = 50;
// ORGANIZATION
export const CLIENT = 20;
// ZOCHIN
export const ORGANIZATION = 30;

export enum REPORT_STATUS {
  CALCULATING = 'CALCULATING',
  UPLOADING = 'UPLOADING',
  WRITING = 'WRITING',
  COMPLETED = 'COMPLETED',
}

export enum Role {
  // 10
  super_admin = SUPER_ADMIN,
  // 20
  client = CLIENT,
  // 30
  organization = ORGANIZATION,
  // 40
  admin = ADMIN,
  // 50
  tester = TESTER,
}
