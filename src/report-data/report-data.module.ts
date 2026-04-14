import { Module } from '@nestjs/common';
import {
  ExamDao,
  QuestionCategoryDao,
  ResultDao,
  UserAnswerDao,
} from 'src/daos/index.dao';
import { VisualizationService } from 'src/pdf/visualization.service';
import { ReportDataService } from './report-data.service';
import { StudioTemplateRuntimeService } from './studio-template-runtime.service';

@Module({
  providers: [
    ReportDataService,
    StudioTemplateRuntimeService,
    ExamDao,
    QuestionCategoryDao,
    ResultDao,
    UserAnswerDao,
    VisualizationService,
  ],
  exports: [ReportDataService, StudioTemplateRuntimeService],
})
export class ReportDataModule {}
