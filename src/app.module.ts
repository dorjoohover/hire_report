import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppProcessor } from './app.processer';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppService } from './app.service';
import { FileService } from './file.service';
import { UserDao } from './daos/user.dao';
import { ExamDao } from './daos/exam.dao';
import { FormuleDao } from './daos/formule.dao';
import { QuestionAnswerCategoryDao } from './daos/question.answer.category.dao';
import { ResultDao } from './daos/result.dao';
import { UserAnswerDao } from './daos/user.answer.dao';
import { PdfService } from './pdf.services';
import {
  Belbin,
  Darktriad,
  DISC,
  Empathy,
  Genos,
  Holland,
  CFS,
  BOS,
  Whoqol,
  MBTI,
  Disagreement,
  Burnout,
  HADS,
  Office,
  Bigfive,
  Narc,
  Setgel,
  SingleTemplate,
} from './pdf/reports';
import { VisualizationService } from './pdf/visualization.service';
import { SinglePdf } from './pdf/single.pdf';
import { AppController } from './app.controller';
import { QuestionCategoryDao } from './daos/question.category.dao';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.development`,
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'report',
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppProcessor,
    AppService,
    FileService,
    ExamDao,
    QuestionAnswerCategoryDao,
    FormuleDao,
    ResultDao,
    UserAnswerDao,
    UserDao,
    PdfService,
    DISC,
    Belbin,
    Darktriad,
    Empathy,
    Genos,
    Holland,
    CFS,
    BOS,
    Whoqol,
    MBTI,
    Disagreement,
    Burnout,
    HADS,
    Office,
    Bigfive,
    Narc,
    QuestionCategoryDao,
    Setgel,
    SingleTemplate,
    VisualizationService,
    SinglePdf,
  ],
})
export class AppModule {}
