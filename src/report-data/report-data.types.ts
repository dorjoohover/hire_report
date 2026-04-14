import { ExamEntity, ResultEntity } from 'src/entities';

export type ReportCategoryBreakdown = {
  questionCategoryId?: number;
  categoryName: string;
  point: number;
  totalPoint: number;
  questionCount?: number;
  duration?: number | null;
};

export type SingleSummaryData = {
  scoreValue: number;
  scoreTotal: number;
  scorePercent: number;
  durationUsed: number;
  durationLimit: number;
  graphBuffer: Buffer;
};

export type SingleQuartileData = {
  percentile: number;
  graphBuffer: Buffer;
  sectionName: string;
  categoryBreakdown: ReportCategoryBreakdown[];
  fallback: boolean;
};

export type SingleReportContext = {
  exam: ExamEntity;
  result: ResultEntity;
  summary: SingleSummaryData;
  quartile: SingleQuartileData;
};

export type StudioTemplatePage = {
  id: string;
  label?: string;
  source?: string;
  description?: string;
  background?: string;
  accent?: string;
};

export type StudioTemplateElementStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  color?: string;
  background?: string;
  padding?: number;
  borderRadius?: number;
  border?: string;
  shadow?: string;
  opacity?: number;
  objectFit?: 'cover' | 'contain';
};

export type StudioTemplateElement = {
  id: string;
  pageId: string;
  kind: 'text' | 'image' | 'graph' | 'categoryList' | 'shape';
  label: string;
  content?: string;
  src?: string;
  graphType?: 'doughnut' | 'quartile';
  dataKey?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: StudioTemplateElementStyle;
};

export type StudioTemplateVariable = {
  key: string;
  token: string;
  label?: string;
  description?: string;
  formula?: string;
  sample?: string;
};

export type StudioTemplateDefinition = {
  id?: number | string | null;
  key?: string | null;
  renderer?: string | null;
  assessmentId?: number | null;
  reportType?: string | null;
  reportTypeCode?: number | null;
  name?: string | null;
  description?: string | null;
  canvas?: {
    width?: number;
    height?: number;
    size?: string;
  } | null;
  pages?: StudioTemplatePage[] | null;
  variables?: StudioTemplateVariable[] | null;
  elements?: StudioTemplateElement[] | null;
  previewData?: Record<string, unknown> | null;
};

export type ResolvedStudioTemplateVariable = {
  key: string;
  token: string;
  label?: string;
  value: unknown;
};

export type StudioTemplateRuntime = {
  templateId?: number | string | null;
  templateKey?: string | null;
  assessmentId?: number | null;
  reportType?: string | null;
  reportTypeCode?: number | null;
  renderer: string;
  title: string;
  previewData: Record<string, unknown>;
  resolvedVariables: ResolvedStudioTemplateVariable[];
  graphDataUrls: Record<string, string>;
  html: string;
};
