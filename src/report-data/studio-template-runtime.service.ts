import { Injectable } from '@nestjs/common';
import { ReportType } from 'src/base/constants';
import {
  ReportCategoryBreakdown,
  StudioTemplateDefinition,
  StudioTemplateElement,
  StudioTemplateRuntime,
} from './report-data.types';
import { ReportDataService } from './report-data.service';

const BRAND_COLOR = '#EF3638';
const STUDIO_ASSET_BASE = '/studio-assets';
const stableStudioAssets = {
  logo: `${STUDIO_ASSET_BASE}/logo.png`,
  logoWhite: `${STUDIO_ASSET_BASE}/logo-white.png`,
  top: `${STUDIO_ASSET_BASE}/top.png`,
  headerTopWhite: `${STUDIO_ASSET_BASE}/header-top-white.png`,
  clock: `${STUDIO_ASSET_BASE}/clock.png`,
  author: `${STUDIO_ASSET_BASE}/author.png`,
  quarter: `${STUDIO_ASSET_BASE}/quarter.png`,
  donutGraphic: `${STUDIO_ASSET_BASE}/doughut.png`,
  quartileGraphic: `${STUDIO_ASSET_BASE}/quartile.png`,
} as const;
const studioAssetMatchers = [
  { match: ['logo-white'], target: stableStudioAssets.logoWhite },
  { match: ['logo'], target: stableStudioAssets.logo },
  { match: ['header-top-white'], target: stableStudioAssets.headerTopWhite },
  { match: ['author'], target: stableStudioAssets.author },
  { match: ['clock'], target: stableStudioAssets.clock },
  { match: ['quarter'], target: stableStudioAssets.quarter },
  { match: ['doughut'], target: stableStudioAssets.donutGraphic },
  { match: ['quartile'], target: stableStudioAssets.quartileGraphic },
  { match: ['top'], target: stableStudioAssets.top },
] as const;

@Injectable()
export class StudioTemplateRuntimeService {
  constructor(private reportDataService: ReportDataService) {}

  async buildRuntime(
    code: string,
    template?: StudioTemplateDefinition | null,
  ): Promise<StudioTemplateRuntime | null> {
    if (!template || template.renderer !== 'absolute-html-v2') {
      return null;
    }

    if (!Array.isArray(template.pages) || !Array.isArray(template.elements)) {
      return null;
    }

    const context = await this.reportDataService.getSingleReportContext(code);
    const reportTypeCode = Number(
      template.reportTypeCode ??
        context.result?.type ??
        context.exam?.assessment?.report ??
        0,
    );

    if (
      reportTypeCode !== ReportType.CORRECT &&
      reportTypeCode !== ReportType.CORRECTCOUNT
    ) {
      return null;
    }

    const previewData = this.buildPreviewData(template, context);
    const graphDataUrls = this.buildGraphDataUrls(template, context);
    const resolvedVariables = Array.isArray(template.variables)
      ? template.variables.map((variable) => ({
          key: variable.key,
          token: variable.token,
          label: variable.label,
          value: previewData[variable.key],
        }))
      : [];

    return {
      templateId: template.id ?? null,
      templateKey: template.key ?? null,
      assessmentId: template.assessmentId ?? context.exam?.assessment?.id ?? null,
      reportType: template.reportType ?? null,
      reportTypeCode: template.reportTypeCode ?? reportTypeCode,
      renderer: template.renderer ?? 'absolute-html-v2',
      title:
        context.exam?.assessmentName ??
        context.exam?.assessment?.name ??
        template.name ??
        'Studio report',
      previewData,
      resolvedVariables,
      graphDataUrls,
      html: this.serializeTemplateHtml(template, previewData, graphDataUrls),
    };
  }

  private buildPreviewData(
    template: StudioTemplateDefinition,
    context: Awaited<ReturnType<ReportDataService['getSingleReportContext']>>,
  ) {
    const assessment = context.exam?.assessment;
    const result = context.result;
    const summary = context.summary;
    const quartile = context.quartile;
    const templatePreviewData = template.previewData ?? {};
    const questionCategories = this.mapQuestionCategories(
      quartile.categoryBreakdown,
    );

    return {
      ...templatePreviewData,
      candidateName:
        this.buildCandidateName(
          context.exam?.firstname ?? result?.firstname,
          context.exam?.lastname ?? result?.lastname,
        ) ??
        templatePreviewData.candidateName ??
        'Шалгуулагч',
      assessmentTitle:
        context.exam?.assessmentName ??
        assessment?.name ??
        templatePreviewData.assessmentTitle ??
        template.name ??
        '',
      reportDate:
        this.formatDate(result?.createdAt) ?? templatePreviewData.reportDate ?? '',
      footerDate:
        this.formatDate(result?.createdAt) ?? templatePreviewData.footerDate ?? '',
      author: assessment?.author ?? templatePreviewData.author ?? '',
      description:
        assessment?.description ?? templatePreviewData.description ?? '',
      measure: assessment?.measure ?? templatePreviewData.measure ?? '',
      usage: assessment?.usage ?? templatePreviewData.usage ?? '',
      scoreLabel:
        templatePreviewData.scoreLabel ??
        (result?.type === ReportType.CORRECTCOUNT
          ? 'Зөв хариулт'
          : 'Нийт оноо'),
      scoreValue: summary.scoreValue,
      scoreTotal: summary.scoreTotal,
      scorePercent: summary.scorePercent,
      durationUsed: summary.durationUsed,
      durationLimit: summary.durationLimit,
      percentile: quartile.percentile,
      questionCategories,
    };
  }

  private buildCandidateName(firstname?: string, lastname?: string) {
    const parts = [firstname, lastname]
      .map((value) => value?.toString().trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return null;
    }

    return parts.join(' ');
  }

  private mapQuestionCategories(categoryBreakdown: ReportCategoryBreakdown[]) {
    return categoryBreakdown.map((item) => ({
      questionCategoryId: item.questionCategoryId ?? null,
      name: item.categoryName,
      value: item.point,
      total: item.totalPoint,
      questionCount: item.questionCount ?? 0,
      duration: item.duration ?? null,
    }));
  }

  private buildGraphDataUrls(
    template: StudioTemplateDefinition,
    context: Awaited<ReturnType<ReportDataService['getSingleReportContext']>>,
  ) {
    const graphDataUrls: Record<string, string> = {};

    for (const element of template.elements ?? []) {
      if (element.kind !== 'graph') {
        continue;
      }

      const buffer =
        element.graphType === 'quartile'
          ? context.quartile.graphBuffer
          : context.summary.graphBuffer;

      graphDataUrls[element.id] = `data:image/png;base64,${buffer.toString(
        'base64',
      )}`;
    }

    return graphDataUrls;
  }

  private resolveTextContent(
    content: string,
    previewData: Record<string, unknown>,
  ) {
    return content.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();
      const value = previewData[key];

      if (value === undefined || value === null) {
        return `{{${key}}}`;
      }

      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }

      return String(value);
    });
  }

  private resolveAssetSource(
    src: string,
    previewData: Record<string, unknown>,
  ) {
    const resolved = this.resolveTextContent(src, previewData);

    if (!resolved || resolved.startsWith('data:') || resolved.startsWith('http')) {
      return resolved;
    }

    if (resolved.startsWith(STUDIO_ASSET_BASE)) {
      return resolved;
    }

    const lowered = resolved.toLowerCase();
    for (const matcher of studioAssetMatchers) {
      if (matcher.match.some((token) => lowered.includes(token))) {
        return matcher.target;
      }
    }

    return resolved;
  }

  private parseRichTextLine(line: string) {
    const runs: { text: string; bold?: boolean; accent?: boolean }[] = [];
    const pattern = /(\*\*[^*]+\*\*|==[^=]+==)/g;
    let cursor = 0;

    for (const match of line.matchAll(pattern)) {
      const index = match.index ?? 0;
      const token = match[0];

      if (index > cursor) {
        runs.push({ text: line.slice(cursor, index) });
      }

      if (token.startsWith('**')) {
        runs.push({
          text: token.slice(2, -2),
          bold: true,
        });
      } else {
        runs.push({
          text: token.slice(2, -2),
          bold: true,
          accent: true,
        });
      }

      cursor = index + token.length;
    }

    if (cursor < line.length) {
      runs.push({ text: line.slice(cursor) });
    }

    return runs.length > 0 ? runs : [{ text: '' }];
  }

  private richTextLinesToHtml(
    content: string,
    previewData: Record<string, unknown>,
    baseWeight: number,
  ) {
    return this.resolveTextContent(content, previewData)
      .split('\n')
      .map((line) =>
        this.parseRichTextLine(line)
          .map((run) => {
            const styles = [
              `font-weight:${run.bold ? Math.max(baseWeight, 700) : baseWeight}`,
              `color:${run.accent ? BRAND_COLOR : 'inherit'}`,
            ].join('; ');

            return `<span style="${styles}">${this.escapeHtml(run.text)}</span>`;
          })
          .join(''),
      )
      .join('<br />');
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private fontChoiceToCss(fontFamily?: string) {
    if (fontFamily === 'display') {
      return "'Gilroy-Bold', sans-serif";
    }

    if (fontFamily === 'mono') {
      return "'Gilroy-Bold', sans-serif";
    }

    return "'Gilroy-Medium', sans-serif";
  }

  private verticalAlignToCss(verticalAlign?: string) {
    if (verticalAlign === 'center') {
      return 'center';
    }

    if (verticalAlign === 'bottom') {
      return 'flex-end';
    }

    return 'flex-start';
  }

  private elementStyleToCss(element: StudioTemplateElement) {
    const style = element.style ?? {};
    const layoutCss =
      element.kind === 'image' || element.kind === 'shape'
        ? []
        : [
            'display:flex',
            'flex-direction:column',
            `justify-content:${this.verticalAlignToCss(style.verticalAlign)}`,
          ];

    return [
      'position:absolute',
      `left:${element.x}px`,
      `top:${element.y}px`,
      `width:${element.width}px`,
      `height:${element.height}px`,
      `font-family:${this.fontChoiceToCss(style.fontFamily)}`,
      `font-size:${style.fontSize ?? 14}px`,
      `font-weight:${style.fontWeight ?? 500}`,
      `line-height:${style.lineHeight ?? 1.4}`,
      `letter-spacing:${style.letterSpacing ?? 0}px`,
      `text-align:${style.textAlign ?? 'left'}`,
      ...layoutCss,
      `color:${style.color ?? '#231F20'}`,
      `background:${style.background || 'transparent'}`,
      `padding:${style.padding ?? 0}px`,
      `border-radius:${style.borderRadius ?? 0}px`,
      `border:${style.border || '0'}`,
      `box-shadow:${style.shadow || 'none'}`,
      `opacity:${(style.opacity ?? 100) / 100}`,
      'white-space:pre-wrap',
      'overflow:hidden',
    ].join('; ');
  }

  private serializeGraph(
    element: StudioTemplateElement,
    graphDataUrls: Record<string, string>,
  ) {
    const graphSource = graphDataUrls[element.id] ?? '';

    return `<img alt="${this.escapeHtml(element.label)}" src="${this.escapeHtml(
      graphSource,
    )}" data-graph="${this.escapeHtml(
      element.graphType ?? 'doughnut',
    )}" style="${this.elementStyleToCss(
      element,
    )}; object-fit:${element.style?.objectFit ?? 'contain'};" />`;
  }

  private serializeShape(element: StudioTemplateElement) {
    return `<div data-shape="${this.escapeHtml(
      element.label,
    )}" style="${this.elementStyleToCss(element)}"></div>`;
  }

  private serializeCategoryList(
    element: StudioTemplateElement,
    previewData: Record<string, unknown>,
  ) {
    const rawGroups = previewData[element.dataKey ?? 'questionCategories'];
    const groups = Array.isArray(rawGroups) ? rawGroups : [];

    const rows = groups
      .map((group) => {
        const item = group as Record<string, unknown>;

        return [
          `<div style="display:flex; justify-content:space-between; gap:14px; padding-bottom:10px; border-bottom:1px solid rgba(35,31,32,0.08);">`,
          `<div style="min-width:0;">`,
          `<div style="font-weight:${element.style?.fontWeight ?? 500}; color:${
            element.style?.color ?? '#231F20'
          };">${this.escapeHtml(String(item.name ?? ''))}</div>`,
          `<div style="margin-top:4px; font-size:11px; color:#7C7A7B;">${this.escapeHtml(
            `${item.questionCount ?? 0} асуулт`,
          )}</div>`,
          `</div>`,
          `<div style="text-align:right; white-space:nowrap; color:${
            element.style?.color ?? '#231F20'
          };">`,
          `<span style="color:${BRAND_COLOR}; font-weight:700;">${this.escapeHtml(
            String(item.value ?? 0),
          )}</span> / ${this.escapeHtml(String(item.total ?? 0))}`,
          `</div>`,
          `</div>`,
        ].join('');
      })
      .join('');

    return `<div data-category-list="${this.escapeHtml(
      element.dataKey ?? 'questionCategories',
    )}" style="${this.elementStyleToCss(
      element,
    )}; display:flex; flex-direction:column; gap:12px;">${rows}</div>`;
  }

  private serializeTemplateHtml(
    template: StudioTemplateDefinition,
    previewData: Record<string, unknown>,
    graphDataUrls: Record<string, string>,
  ) {
    const canvasWidth = Number(template.canvas?.width ?? 595);
    const canvasHeight = Number(template.canvas?.height ?? 842);

    return (template.pages ?? [])
      .map((page) => {
        const blocks = (template.elements ?? [])
          .filter((element) => element.pageId === page.id)
          .map((element) => {
            if (element.kind === 'graph') {
              return this.serializeGraph(element, graphDataUrls);
            }

            if (element.kind === 'categoryList') {
              return this.serializeCategoryList(element, previewData);
            }

            if (element.kind === 'shape') {
              return this.serializeShape(element);
            }

            if (element.kind === 'image') {
              return `<img alt="${this.escapeHtml(
                element.label,
              )}" src="${this.escapeHtml(
                this.resolveAssetSource(element.src ?? '', previewData),
              )}" style="${this.elementStyleToCss(
                element,
              )}; object-fit:${element.style?.objectFit ?? 'contain'};" />`;
            }

            return `<div style="${this.elementStyleToCss(
              element,
            )}">${this.richTextLinesToHtml(
              element.content ?? '',
              previewData,
              element.style?.fontWeight ?? 500,
            )}</div>`;
          })
          .join('\n');

        return [
          `<section data-page="${page.id}" data-source="${this.escapeHtml(
            page.source ?? 'custom',
          )}" style="position:relative; width:${canvasWidth}px; height:${canvasHeight}px; overflow:hidden; border-radius:32px; background:${
            page.background ?? '#ffffff'
          }; background-image:${page.accent || 'none'};">`,
          blocks,
          '</section>',
        ].join('\n');
      })
      .join('\n\n');
  }

  private formatDate(date?: Date | string | null) {
    if (!date) {
      return null;
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');

    return `${year}.${month}.${day}`;
  }
}
