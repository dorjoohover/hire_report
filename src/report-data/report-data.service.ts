import { Injectable } from '@nestjs/common';
import {
  ResultDao,
  UserAnswerDao,
  ExamDao,
  QuestionCategoryDao,
} from 'src/daos/index.dao';
import { ResultEntity } from 'src/entities';
import { colors } from 'src/pdf/formatter';
import { VisualizationService } from 'src/pdf/visualization.service';
import {
  ReportCategoryBreakdown,
  SingleQuartileData,
  SingleReportContext,
  SingleSummaryData,
} from './report-data.types';

@Injectable()
export class ReportDataService {
  constructor(
    private examDao: ExamDao,
    private resultDao: ResultDao,
    private userAnswerDao: UserAnswerDao,
    private questionCategoryDao: QuestionCategoryDao,
    private visualizationService: VisualizationService,
  ) {}

  async getSingleReportContext(
    code: string,
    category?: number,
  ): Promise<SingleReportContext> {
    const [exam, result] = await Promise.all([
      this.examDao.findByCode(code),
      this.resultDao.findOne(code),
    ]);

    return {
      exam,
      result,
      summary: await this.buildSingleSummary(result),
      quartile: await this.buildSingleQuartile(result, category),
    };
  }

  async buildSingleSummary(result: ResultEntity): Promise<SingleSummaryData> {
    const scoreValue = Number(result.point ?? 0);
    const scoreTotal = Number(result.total ?? 0);
    const durationUsed = Number(result.duration ?? 0);
    const durationLimit = Number(result.limit ?? 0);
    const scorePercent =
      scoreTotal > 0 ? Math.round((scoreValue / scoreTotal) * 100) : 0;

    const graphBuffer = await this.visualizationService.doughnut(
      colors.nonprogress,
      scoreTotal,
      scoreValue,
    );

    return {
      scoreValue,
      scoreTotal,
      scorePercent,
      durationUsed,
      durationLimit,
      graphBuffer,
    };
  }

  async buildSingleQuartile(
    result: ResultEntity,
    category?: number,
  ): Promise<SingleQuartileData> {
    const categoryBreakdown = await this.getCategoryBreakdown(result, category);
    const historicalData = await this.resultDao.findQuartileWithTotal(
      result.assessment,
    );

    const currentScore = Number(result.point ?? 0);
    const currentTotal = Number(result.total ?? 0);
    const sameTotalRows = historicalData.filter(
      (item) => Number(item.total ?? 0) === currentTotal,
    );
    const maxId = Math.max(...sameTotalRows.map((item) => item.id));

    const compatibleData = historicalData.filter(
      (item) =>
        Number(item.total ?? 0) === currentTotal && item.id !== maxId,
    );

    if (compatibleData.length < 3) {
      return await this.buildFallbackQuartile(result, categoryBreakdown);
    }

    const datasetForStats = compatibleData.map((item) => Number(item.point ?? 0));

    if (datasetForStats.length === 0) {
      return await this.buildFallbackQuartile(result, categoryBreakdown);
    }

    const mean = this.calculateMean(datasetForStats);
    const stdDev = this.calculateStdDev(datasetForStats, mean);

    const dataPoints: number[][] = [];
    for (let x = mean - 3 * stdDev; x <= mean + 3 * stdDev; x += 1) {
      dataPoints.push([x, this.normalDistribution(x, mean, stdDev) / 10]);
    }

    const percentile = this.percentileExcludingCurrent(
      historicalData.map((item) => ({
        id: item.id,
        point: Number(item.point ?? 0),
      })),
      currentScore,
    );

    const max = Math.max(...datasetForStats, currentScore);

    const graphBuffer = await this.visualizationService.createChart(
      dataPoints,
      dataPoints[0]?.[0] ?? 0,
      dataPoints[dataPoints.length - 1]?.[0] ?? max,
      this.normalDistribution(currentScore, mean, stdDev) / 10 -
        (dataPoints[0]?.[1] ?? 0),
      currentScore,
      percentile,
    );

    return {
      percentile,
      graphBuffer,
      sectionName: result.assessmentName,
      categoryBreakdown,
      fallback: false,
    };
  }

  async getCategoryBreakdown(
    result: ResultEntity,
    category?: number,
  ): Promise<ReportCategoryBreakdown[]> {
    const [rows, categories] = await Promise.all([
      this.userAnswerDao.partialCalculator(result.code, result.type, category),
      this.questionCategoryDao.findByAssessmentId(result.assessment),
    ]);

    const categoryById = new Map(
      categories.map((item) => [item.id, item] as const),
    );

    return rows.map((row) => ({
      questionCategoryId: row.categoryId,
      categoryName: row.categoryName,
      point: Number(row.point ?? 0),
      totalPoint: Number(
        row.totalPoint ??
          categoryById.get(row.categoryId)?.totalPoint ??
          0,
      ),
      questionCount: Number(
        row.questionCount ??
          categoryById.get(row.categoryId)?.questionCount ??
          0,
      ),
      duration:
        row.duration ??
        categoryById.get(row.categoryId)?.duration ??
        null,
    }));
  }

  private async buildFallbackQuartile(
    result: ResultEntity,
    categoryBreakdown: ReportCategoryBreakdown[],
  ): Promise<SingleQuartileData> {
    const total = Math.max(Number(result.total ?? 0), 1);
    const mean = total / 2;
    const stdDev = total / 6;
    const currentScore = Number(result.point ?? 0);
    const minX = Math.max(0, mean - 3 * stdDev);
    const maxX = Math.min(total, mean + 3 * stdDev);
    const dataPoints: number[][] = [];

    for (let x = minX; x <= maxX; x += (maxX - minX) / 100) {
      dataPoints.push([x, this.normalDistribution(x, mean, stdDev) / 10]);
    }

    const graphBuffer = await this.visualizationService.createChart(
      dataPoints,
      minX,
      maxX,
      this.normalDistribution(currentScore, mean, stdDev) / 10,
      currentScore,
      100,
    );

    return {
      percentile: 100,
      graphBuffer,
      sectionName: result.assessmentName,
      categoryBreakdown,
      fallback: true,
    };
  }

  private calculateMean(data: number[]) {
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }

  private calculateStdDev(data: number[], mean: number) {
    const variance =
      data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      data.length;

    return Math.sqrt(variance);
  }

  private normalDistribution(x: number, mean: number, stdDev: number) {
    const exponent = Math.exp(
      -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)),
    );

    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * exponent;
  }

  private percentileExcludingCurrent(
    historicalData: { id?: number; point: number }[],
    currentScore: number,
  ) {
    if (historicalData.length === 0) {
      return 100;
    }

    const countBelow = historicalData.filter(
      (item) => item.point < currentScore,
    ).length;

    return Math.round((countBelow / historicalData.length) * 100);
  }
}
