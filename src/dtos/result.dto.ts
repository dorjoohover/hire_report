export class ResultDto {
  code: number;

  assessmentName: string;

  lastname: string;

  firstname: string;

  total?: number;

  type: number;

  assessment: number;
  // possible duration

  limit: number;
  //during duration

  duration: number;

  point?: number;
  // in disc (d || c || di)

  result?: string;
  // 1233

  segment?: string;
  // in disc (undershift | overshift)

  value?: string;
}

export class ResultDetailDto {
  // @ApiProperty()
  // result: number;
  //   in disc (Хувиа хичээгч, шулуухан)

  value?: string;
  // like key => in disc intensity(27.5)

  cause?: string;
  //   in disc d, c , i, s

  category?: string;
}
