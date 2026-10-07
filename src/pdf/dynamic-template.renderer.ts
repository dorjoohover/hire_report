import { cachedSource, fitForBox } from './image-fit';
import { Injectable } from '@nestjs/common';
import { NAMED_SQL } from 'src/report-data/named-sql';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  colors,
  fontBold,
  fontNormal,
  marginX,
  header,
  title,
  title10,
  info,
  footer,
  home,
  dateFormatter,
  generateQRCodeSync,
} from './formatter';
import { SinglePdf } from './single.pdf';
import { VisualizationService } from './visualization.service';
import { AssetsService } from 'src/assets_service/assets.service';
import { UserAnswerDao } from 'src/daos/index.dao';
import { AssessmentVariableDao } from 'src/daos/assessment-variable.dao';
import { ExamEntity, PdfTemplateEntity, ResultEntity } from 'src/entities';
// DISC тайлангийн (reports/disc.ts) хатуу кодлогдсон enMn/values lookup-уудыг
// resolveTokens()-д ЯГ АДИЛ ашиглана — Studio-д "{{result.valueLabel}}" гэх
// мэт token бичихэд DISC-ийн legacy тайлантай яг ижил Монгол нэршил гарна
// (жишээ нь "Creative" → "Санаачлагч"). Зөвхөн result.value/result талбар
// DISC-ийн формоор ирсэн үед л утга олдоно — бусад тестэд хоосон буцна.
import { DISC } from './reports/disc';
import {
  ScoreRuleInputs,
  categoryAvg,
  evaluateScoreRules,
  evaluateScoreRulesForAnswerCategory,
  evaluateScoreRulesForCategory,
  evaluateScoreRulesForSub,
  isAnswerCategorySource,
} from './score-rules';
import { CustomTokenName, applyTokenAliases } from './token-aliases';
import { customChartDisplay, normalizeCustomChart } from './custom-chart';
import {
  QUESTION_TOKEN_KEY_RE,
  QuestionAnswerRow,
  groupQuestionAnswers,
  questionTokenValue,
} from './question-answer';
import { TableConfig, buildAnchorMap, cellEdges, cellVisual, listAnchors } from './table-block';
import { makeTextReplacer } from './block-texts';
import { RichSeg, drawRichText, layoutRichText } from './rich-layout';
import {
  AnswerCategoryTotal,
  AnswerMaxRow,
  AnswerStatRow,
  GROUP_TOKEN_RE,
  GroupRef,
  answerCategoryMaxes,
  answerCategoryTotals,
  groupAnswerCategoryTotal,
  inGroupRef,
  answerDemoValue,
  answerRowsByName,
  formatAnswerNumber,
  groupTokenValue,
  WheelConfig,
  evalNumberExpression,
  levelCardColumns,
  LEVEL_CARD_SUBTITLE_GAP,
  normalizeLevelCards,
  normalizeProgress,
  normalizeWheel,
  progressFraction,
  progressHeight,
  progressHidden,
  wheelAxisAngle,
  wheelAxisValue,
  wheelDemoValue,
  wheelLabelLines,
  wheelLayout,
  wheelMarkerAxes,
  wheelValueFraction,
  WHEEL_LEGEND_FS,
  WHEEL_LEGEND_ROW_H,
} from './report-widgets';

// Studio Canvas-ийн PDF_LINE_HEIGHT (Gilroy-Medium: (774+226+213)/1000) болон
// Chrome-ийн half-leading тооцоонд ашиглах ascent/descent (hhea, 1000-д).
const DEFAULT_LINE_HEIGHT = 1.213;
const GILROY_ASCENT = 774;
const GILROY_DESCENT = 226;

// ─────────────────────────────────────────────────────────────────────────────
// Studio-гоос (PDF builder) хадгалсан pdf_template.pages-ийг (JSON) уншиж, яг
// тэр блокуудын байрлал/дарааллаар нь бодит exam/result/assessment датагаар
// PDF зурна.
//
// PDFKit-ийн .text()/.image() зэрэг нь x/y-г шууд авдаг тул render хийхийн
// өмнө блок бүрийн хувьд doc.x=block.x, doc.y=block.y гэж тавиад дараа нь
// formatter.ts/single.pdf.ts дахь ХАРИЛЦАН ТААРАХ функцүүдийг дуудна
// (header/title10/info/section-header/score-section/list-item/score-default/
// quartile/footer/cover нь яг эдгээр функцүүдийн дүрслэлийг илэрхийлэхээр
// studio талд зохион байгуулагдсан). header/title10/footer/cover нь studio
// canvas дээр ч чирдэггүй, хуудасны тогтмол цэг дээрх бүтэн өргөнтэй fixture
// тул эдгээрт л block.x/y-г тооцохгүй. Бусад блокуудын хувьд width/style ч
// аль болох хэрэглэгдэнэ — гэхдээ info/title/score-section/list-item/
// score-default/quartile зэрэг НЭГ дор олон hardcoded report-д хуваалцдаг
// formatter.ts/single.pdf.ts функцүүдийн дотоод текст-өргөн/margin тооцоо нь
// (тэдгээрийг өөрчлөхгүйн тулд) block.width-ийг бүрэн дагадаггүй.
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderCtx {
  result: ResultEntity;
  exam: ExamEntity;
  firstname: string;
  lastname: string;
}

const KNOWN_FONTS = new Set([
  'fontNormal',
  'fontMedium',
  'fontBold',
  'fontBlack',
  'Gilroy',
  'Gilroy-Bold',
  'Gilroy-ExtraBold',
  'Gilroy-Black',
]);

// studio/lib/richtext.ts-тэй ЯГ АДИЛ логик — хэрэглэгч RightPanel-ийн
// "Агуулга" талбарт бичсэн **тод**, ~~хар~~ болон ==#hex|онцолсон== (эсвэл
// хуучин ==онцолсон==) тэмдэглэгээг задална. Гурвал ТУСГААРЛАГДСАН toggle тул
// хослуулж (жиш: ~~==#7B61FF|текст==~~) бичвэл хэдийг ч нэг дор авчирна. "=="
// нээгдэх үед шууд ард нь "#RRGGBB|" prefix ирвэл тухайн өнгийг accentColor
// болгож санана — ирээгүй бол DEFAULT_ACCENT_COLOR (brand orange) ашиглана
// (хуучин загваруудтай ар талын нийцтэй). Өөр service (studio нь Next.js,
// эндээс шууд import хийх боломжгүй) тул давхардуулан бичсэн — 2 талд
// өөрчлөлт хийхдээ хоёуланг нь синк байлгах.
const DEFAULT_ACCENT_COLOR = '#F36421';
// "score-level" блокийн ДЕФОЛТ (block.content хоосон бол) текст загвар —
// studio/lib/types.ts-ийн DEFAULT_SCORE_LEVEL_CONTENT-тэй ЯГ адил байлгах
// (тэндээс шууд import хийх боломжгүй тул давхардуулав — 2 талд өөрчлөлт
// хийхдээ хоёуланг нь синк байлгах).
const DEFAULT_SCORE_LEVEL_CONTENT =
  '**{{level.category}}**: ==#F36421|{{level.score}}== буюу ==#F36421|{{level.label}}==\nНийт оноо ==#F36421|{{level.score}}==/{{level.max}}';
interface RichTextSegment {
  text: string;
  bold: boolean;
  black: boolean; // fontBlack/Gilroy-Black — bold-той зэрэг идэвхтэй бол black давамгайлна
  accent: boolean;
  accentColor?: string;
  italic?: boolean; // __налуу__
  link?: string; // [текст](url)
  size?: number; // ^^18|текст^^ — тухайн хэсгийн фонтын хэмжээ (studio/lib/richtext.ts-тэй ижил)
  leader?: boolean; // {..} — цэг гүйцээх (rich-layout.ts, текст блок)
}
const LINK_RE = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;
const SIZE_OPEN_RE = /^\^\^(\d{1,2}(?:\.\d)?)\|/;
const LINK_COLOR = '#008AEA';
const REAL_FIRST_KEYS = new Set([
  'score.total',
  'score.max',
  'score.percent',
  'assessment.totalScore',
  'assessment.maxScore',
  'assessment.percent',
]);
// PDFKit-ийн continued урсгалд link/underline дараагийн хэсэгт "үлддэг"
// тул сегмент бүрт тодорхой (null/false) дамжуулна.
function segLinkOpts(seg: { link?: string }) {
  return { link: seg.link || null, underline: !!seg.link };
}
// Gilroy фонтод БАЙХГҮЙ тусгай зай/үл үзэгдэх тэмдэгтүүд (Word/Google Docs-оос
// хуулахад "±"-ийн хажууд ирдэг нарийн зай U+202F, NBSP U+00A0 гэх мэт) PDF
// дээр босоо зураас (.notdef) болж гардаг байсан — энгийн зайгаар солино.
// "\t" (Studio-д Tab дарж оруулсан догол) → 4 зай.
export function normalizePdfText(s: string): string {
  if (!s) return s;
  return s
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[\u2010\u2011]/g, '-') // hyphen / non-breaking hyphen — Gilroy-д байхгүй
    .replace(/[\u2028\u2029]/g, '\n') // line/paragraph separator
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, '')
    .replace(/\t/g, '    ');
}


// ── "Дугаартай жагсаалт" (listStyle="numbered") ────────────────────────────
// "Жагсаалт (•)"-тэй адил: мөр (Enter) бүр нэг зүйл, урд нь автоматаар
// 1., 2., 3. … дугаар (хоосон мөр алгасна, зүйл хооронд 4px). Дугаар зүүн
// талд, текст (ороосон мөрүүд ч) догол зайнаас эхэлнэ.
//  • Мөр аль хэдийн "5. …" / "5) …" гэж эхэлсэн бол тэр дугаарыг ашиглана
//    (дараагийнх нь 6-аас үргэлжилнэ).
//  • Гараар дугаарласан мөр байвал дугааргүй мөрүүд, мөн Tab/зайгаар
//    эхэлсэн мөр — өмнөх зүйлийн ҮРГЭЛЖЛЭЛ (дугааргүй, ижил
//    догол): жиш "Зөв хариулт: B", "Тайлбар: …".
// studio/lib/richtext.ts ↔ hire_report dynamic-template.renderer.ts — ЯГ АДИЛ.
interface NumberedParagraph {
  marker?: string;
  text: string;
}
const NUMBERED_LINE_RE = /^(\d{1,3})([.)])[ \t]+(.*)$/;
function splitNumberedParagraphs(text: string): NumberedParagraph[] {
  const out: NumberedParagraph[] = [];
  const lines = (text || '').split('\n');
  // Текстэд "1. …" гэж гараар дугаарласан мөр БАЙВАЛ зөвхөн тэдгээр мөр
  // дугаар авна, бусад мөр ("Зөв хариулт: B", "Тайлбар: …") нь өмнөх зүйлийн
  // үргэлжлэл болно (Word-оос хуулж тавьсан текст шууд зөв гарна).
  // Гараар дугаарласан мөр огт байхгүй бол мөр бүрийг автоматаар дугаарлана.
  const manual = lines.some((l) => NUMBERED_LINE_RE.test(l.trim()));
  let n = 0;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const line = raw.trim();
    if ((/^[ \t]+\S/.test(raw) || (manual && !NUMBERED_LINE_RE.test(line))) && out.length > 0) {
      out.push({ text: line });
      continue;
    }
    const m = line.match(NUMBERED_LINE_RE);
    if (m) {
      n = Number(m[1]);
      out.push({ marker: `${m[1]}${m[2]}`, text: m[3] });
    } else {
      n += 1;
      out.push({ marker: `${n}.`, text: line });
    }
  }
  return out;
}

function parseRichTextSegments(content: string): RichTextSegment[] {
  if (!content) return [];
  content = normalizePdfText(content);
  const segments: RichTextSegment[] = [];
  let bold = false;
  let black = false;
  let italic = false;
  let accent = false;
  let accentColor: string | undefined;
  let size: number | undefined;
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) segments.push({ text: buf, bold, black, accent, accentColor, italic, size });
    buf = '';
  };
  while (i < content.length) {
    if (content.startsWith('^^', i)) {
      // ^^18|текст^^ — фонтын хэмжээ. Нээгч дугааргүй бол энгийн "^^" тэмдэгт.
      const m = size === undefined ? content.slice(i).match(SIZE_OPEN_RE) : null;
      if (size !== undefined) {
        flush();
        size = undefined;
        i += 2;
      } else if (m && Number(m[1]) >= 4 && Number(m[1]) <= 96) {
        flush();
        size = Number(m[1]);
        i += m[0].length;
      } else {
        buf += '^^';
        i += 2;
      }
    } else if (content.startsWith('**', i)) {
      flush();
      bold = !bold;
      i += 2;
    } else if (content.startsWith('~~', i)) {
      flush();
      black = !black;
      i += 2;
    } else if (content.startsWith('__', i)) {
      flush();
      italic = !italic;
      i += 2;
    } else if (content[i] === '[') {
      const m = content.slice(i).match(LINK_RE);
      if (m) {
        flush();
        segments.push({ text: m[1], bold, black, accent, accentColor, italic, size, link: m[2] });
        i += m[0].length;
      } else {
        buf += '[';
        i += 1;
      }
    } else if (content.startsWith('{..}', i)) {
      // {..} — "цэг гүйцээх": мөрийн үлдсэн зайг цэгээр дүүргэж ардах текстийг баруун захад
      // зэрэгцүүлнэ (rich-layout.ts layoutWithLeaders). Одоогийн загвар цэгүүдэд үйлчилнэ.
      flush();
      segments.push({ text: '', bold, black, accent, accentColor, italic, size, leader: true });
      i += 4;
    } else if (content.startsWith('==', i)) {
      flush();
      if (!accent) {
        const rest = content.slice(i + 2);
        const colorMatch = rest.match(/^(#[0-9A-Fa-f]{3,8})\|/);
        if (colorMatch) {
          accentColor = colorMatch[1];
          i += 2 + colorMatch[0].length;
        } else {
          accentColor = DEFAULT_ACCENT_COLOR;
          i += 2;
        }
        accent = true;
      } else {
        accent = false;
        accentColor = undefined;
        i += 2;
      }
    } else {
      buf += content[i];
      i += 1;
    }
  }
  flush();
  return segments;
}

// Томьёо хувьсагчийн утгыг текст болгоно — decimals (0–4) хүртэл тоймлоод илүү 0-гүй
// (2640, 12.5). Тооцоолж чадаагүй (буруу томьёо, 0-д хуваах) бол хоосон.
function formatFormulaValue(v: number | null, decimals: number): string {
  if (v === null || !Number.isFinite(v)) return '';
  const p = Math.pow(10, Math.min(4, Math.max(0, Math.round(decimals) || 0)));
  return String(Math.round(v * p) / p);
}

/**
 * Энэ report-ийн өөрийн core API-ийн үндэс ("…/api/v1/"). `CORE_API_URL` (бүтэн), эсвэл
 * app.service-тэй ижил `CORE` ("http://core:5000/") + "api/v1/". Аль нь ч байхгүй бол null.
 */
export function coreApiBase(env: NodeJS.ProcessEnv = process.env): string | null {
  const full = (env.CORE_API_URL || '').trim();
  if (full) return full.replace(/\/?$/, '/');
  const core = (env.CORE || '').trim();
  if (!core) return null;
  return `${core.replace(/\/?$/, '/')}api/v1/`;
}

@Injectable()
export class DynamicTemplateRenderer {
  constructor(
    private single: SinglePdf,
    private vis: VisualizationService,
    private userAnswer: UserAnswerDao,
    private variableDao: AssessmentVariableDao,
  ) {}

  // "Үр дүн" маягийн orange bold гарчиг + underline — 'section-header' болон
  // 'score-summary' (нэгтгэсэн) хоёулаа ашиглана.
  private drawSectionHeaderLine(doc: PDFKit.PDFDocument, text: string, x: number) {
    // Хамгийн зузаан жин — Gilroy-Black (Studio Canvas: fontWeight 900).
    this.safeFontWeight(doc, undefined, 'black');
    doc.fontSize(16).fillColor(colors.orange).text(text, x, doc.y + 10);
    doc
      .moveTo(x, doc.y + 2)
      .strokeColor(colors.orange)
      .lineTo(x + 60, doc.y + 2)
      .stroke()
      .moveDown();
  }

  private safeFont(doc: PDFKit.PDFDocument, name?: string, bold = false) {
    const fallback = bold ? fontBold : fontNormal;
    // ⚠ block.style.fontFamily нь ШИНЭ блок бүрт анхнаасаа "Gilroy" гэж
    // тохируулагдсан байдаг (store.ts-ийн addBlock()) — өөрөөр хэлбэл ХЭЗЭЭ Ч
    // хоосон биш. Иймд өмнө нь bold=true ирсэн ч "Gilroy" (KNOWN_FONTS-д
    // байгаа тул) шууд ашиглагдаж, тод болгох хүсэлтийг үл тоомсорлодог байсан
    // — heading болон rich-text **тод** сегментүүд бодит PDF дээр огт тод
    // гардаггүй байсны шалтгаан яг энэ байв. Одоо: bold хүсвэл, name нь
    // өөрөө аль хэдийн тод/хар вариант (Bold/Black) биш л бол fallback-руу
    // шилжинэ — хэрэглэгчийн сонгосон энгийн фонт bold сегментийг дарж
    // чадахгүй.
    const isBoldish = name ? /bold|black/i.test(name) : false;
    const useName = name && KNOWN_FONTS.has(name) && (!bold || isBoldish);
    doc.font(useName ? name! : fallback);
  }

  // rich-text сегментүүдэд (case 'text') зориулсан 3-түвшний фонт сонголт —
  // safeFont() нь bool (тод/тод-биш) хоёр төлөвтэй тул "хар" (fontBlack,
  // 'Тод'-оос илүү хүнд) шаардлагад хүрэлцэхгүй. 'black' сонгогдвол
  // block.style.fontFamily нь өөрөө аль хэдийн 'black' вариант биш л бол
  // үргэлж 'fontBlack'-руу шилжинэ (bold-той адил зарчим).
  private safeFontWeight(
    doc: PDFKit.PDFDocument,
    name: string | undefined,
    weight: 'normal' | 'bold' | 'black',
    italic = false,
  ) {
    // __налуу__ — Gilroy-ийн жинхэнэ italic фонтууд (pdf.services.ts-ийн
    // createBaseDoc()-д бүртгэгдсэн). Бүртгэгдээгүй бол энгийнээрээ.
    if (italic) {
      const name = weight === 'black' ? 'fontBlackItalic' : weight === 'bold' ? 'fontBoldItalic' : 'fontNormalItalic';
      try {
        doc.font(name);
        return;
      } catch {
        /* fallthrough */
      }
    }
    if (weight === 'black') {
      const isBlackish = name ? /black/i.test(name) : false;
      doc.font(name && KNOWN_FONTS.has(name) && isBlackish ? name : 'fontBlack');
      return;
    }
    this.safeFont(doc, name, weight === 'bold');
  }

  // AI Data tab-ийн "JSON өгөгдөл" (studio/lib/jsonpath.ts-тэй адил логик) —
  // template.aiJsonData дотор дурын гүнзгийрсэн зам (score.total,
  // subscales[0].name гэх мэт) байвал уншина. Зөвхөн createPreviewPdf-ээр
  // дамжсан template-д л bөглөгдөнө — жинхэнэ generate-д ихэвчлэн хоосон.
  private currentAiJsonData: any = null;
  // Studio-ийн "Хэрэглэгчийн variable" (assessment_variable хүснэгт) — render()
  // эхэнд exam.assessment.id-аар нэг л удаа татаж, тухайн exam-ийн
  // result.result (жиш нь "d") утгаар entries-ээс тохирох мөрийг урьдчилан
  // сонгоод "custom.<key>" token болгон бэлдэнэ (DISC.characterDescription
  // fallback-тай яг адил зарчим, гэхдээ ХЭРЭГЛЭГЧИЙН ӨӨРИЙН тодорхойлсон
  // map-аас).
  private currentCustomVariableTokens: Record<string, string> = {};
  // custom.<key>-ийн ТҮҮХИЙ (result.result-оор шүүгдээгүй) entries map —
  // {{custom.<key>[<indexPath>]}} мэт ДУРЫН token-оор (result.result-оос
  // өөр ч зам байж болно) индексжүүлэхэд ашиглана.
  private currentCustomVariableEntries: Record<string, Record<string, string>> = {};
  // Нөхцөлт (kind='score') хувьсагчийн сонгогдсон текст дотор өөр token
  // ({{score.total}} гэх мэт) байж болох тул resolveTokens-ийг НЭГ удаа
  // дахин (рекурс) ажиллуулна — энэ тоолуур хязгааргүй давталтаас хамгаална.
  private tokenDepth = 0;
  // Бүлэг тус бүрийн үр дүн (тестийн бүлгийн дарааллаар) —
  // {{category[1].name}}, {{category[1].avg}} ... token болон
  // {{custom.<key>[1]}} (нөхцөлт хувьсагчийг 1-р бүлгээр үнэлэх)-д.
  private currentCategoryStats: {
    id?: number;
    categoryName: string;
    point: number;
    totalPoint: number;
    count: number;
  }[] = [];
  // kind='score' хувьсагчдын дүрэм — {{custom.<key>[i]}}-г бүлэг бүрээр үнэлэхэд.
  private currentScoreRules: Record<string, any> = {};
  // Хэрэглэгчийн хувьсагчдын "Харагдах нэр" — {{<нэр>}} хэлбэрээр дуудахад.
  private currentCustomNames: CustomTokenName[] = [];
  private currentScoreInput: ScoreRuleInputs = { point: null, total: null, categories: [] };
  // Studio demo preview (result.code = 'DEMO-PREVIEW') — бодит хариултгүй.
  private demoMode = false;
  private currentResultCode: string | null = null;
  private currentAnswerStats: AnswerStatRow[] = [];
  // Дэд бүлэг (хариултын ангилал) тус бүрийн оноо — тестийн хариултын ангиллын дарааллаар (id)
  // — {{answerCategory[i].…}}, {{i-р дэд бүлгийн …}}, дэд бүлгийн эх сурвалжтай {{custom.x[i]}}.
  private currentAnswerCategories: AnswerCategoryTotal[] = [];
  // Дээд онооны түүхий мөрүүд (асуултын бүтэц) — {{category[g].answerCategory[i].max}}-д бүлгээр
  // шүүж дахин бодно; бүлэг бүрийн үр дүн кэштэй (нэг render).
  private currentAnswerMaxRows: AnswerMaxRow[] | null = null;
  private groupMaxCache = new Map<string, Map<number, number>>();
  // {{question[<id>].answer}} — тухайн шалгалтын хариултууд асуултын id-аар (нэг query).
  private currentQuestionAnswers = new Map<number, QuestionAnswerRow[]>();
  // Томьёо (kind='formula') хувьсагчид — {{custom.<key>}} = expression-ийн тооцоолсон тоо
  // (GPAQ: өдөр × минут × МЕТ). Нэг render-д кэштэй, тойрог дуудлагаас formulaStack хамгаална.
  private currentFormulas: Record<string, { expression: string; decimals: number }> = {};
  private formulaCache = new Map<string, number | null>();
  private formulaStack = new Set<string>();
  // "wheel-radar" — хариултын ангиллын оноо (нэг render-д нэг л удаа).
  private answerStatsCache: Promise<AnswerStatRow[]> | null = null;
  private getByPath(obj: any, path: string): any {
    if (obj == null || !path) return undefined;
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  // reports/disc.ts-ийн "Үе шат II" (disc-trait-table-ийн groupedDetails-тэй
  // яг адил логик) — result.details-ээс тухайн category (d/i/s/c)-д бодитоор
  // СОНГОГДСОН (тохирсон хариулт өгсөн) шинж чанаруудыг DISC.description-ийн
  // тайлбартай нь хамт **тод нэр**: тайлбар хэлбэрээр угтвар үүсгэнэ — үр
  // дүн нь өөрөө **/~~/== rich-text тэмдэглэгээ агуулсан тул parseRichTextSegments
  // ('disc-trait-icon'/'text' case-үүд) дараа нь автоматаар зөв задлана. Ганц ч
  // тохирсон шинж алга бол хоосон буцна (resolveTokens-д хоосон утга болно).
  private buildSelectedTraitsText(result: any, category: 'd' | 'i' | 's' | 'c'): string {
    const details: any[] = (result as any)?.details || [];
    const matched = details.filter((d) => (d.category || '').toLowerCase() === category);
    if (!matched.length) return '';
    return matched
      .map((d) => {
        const desc = (DISC as any).description?.[category]?.[d.value]?.value;
        return desc ? `**${d.value}**: ${desc}` : `**${d.value}**`;
      })
      .join('\n\n');
  }

  // Studio-ийн DATA_FIELDS-тэй тохирсон placeholder-уудыг ({{user.firstname}}
  // гэх мэт) бодит утгаар сольж өгнө. AI Data JSON-д тухайн key байвал ЭНЭ нь
  // давамгайлна (studio-ийн Canvas.tsx-тэй адил зарчим — 2 preview зэрэгцэн
  // нийцтэй байх ёстой). Танигдаагүй key-г хоосон болгоно.
  private resolveTokens(content: string | undefined, ctx: RenderCtx): string {
    if (!content) return '';
    // {{Нийт оноо}}, {{1-р бүлгийн нэр}}, {{<хувьсагчийн нэр>}} → дотоод token.
    // {{<нөхцөлт хувьсагчийн нэр>[Багын оролцоо]}} — "Бүлэг / дэд бүлэг" эх
    // сурвалжтай хувьсагчийг тухайн дэд бүлгийн оноогоор үнэлнэ. Сонгогдсон
    // текст доторх token-ууд доорх дамжлагуудаар шийдэгдэнэ.
    content = content.replace(
      /\{\{\s*([^{}\[\]\n]+?)\s*\[\s*([^\]{}\n]+?)\s*\]\s*\}\}/g,
      (m, left: string, idx: string) => {
        if (/^\d+$/.test(idx) || this.tokenDepth > 1) return m;
        const key = this.scoreVarKey(left);
        const rules = key ? this.currentScoreRules[key] : null;
        if (rules && isAnswerCategorySource(rules)) {
          // {{Эрсдэл[Тамхи]}} — "Тамхи" дэд бүлгийн (хариултын ангилал) оноогоор.
          const want = idx.trim().replace(/\s+/g, ' ').toLowerCase();
          const row =
            this.currentAnswerCategories.find(
              (c) => (c.name || '').trim().replace(/\s+/g, ' ').toLowerCase() === want,
            ) ?? this.blockAnswerCategoryRow(idx, rules.source?.category);
          return evaluateScoreRulesForAnswerCategory(
            rules,
            this.currentScoreInput,
            row ?? { name: idx.trim(), point: null as any, count: 0 },
          );
        }
        if (!rules || rules.source?.type !== 'group') return m;
        return evaluateScoreRulesForSub(rules, this.currentScoreInput, idx);
      },
    );
    // {{Бүлэг[Гүйцэтгэл]}}, {{Бүлэг[Гүйцэтгэл/Дэд бүлэг]}}, {{Дэд бүлэг[…]}} —
    // бүлэг (асуултын ангилал) / дэд бүлэг (хариултын ангилал)-ийн оноо.
    content = content.replace(GROUP_TOKEN_RE, (_m, kind: string, path: string, field?: string) =>
      formatAnswerNumber(
        this.demoMode
          ? answerDemoValue(path.trim(), field)
          : groupTokenValue(kind, path, field, this.currentCategoryStats, this.currentAnswerStats),
      ),
    );
    content = applyTokenAliases(content, this.currentCustomNames);
    const { result, exam, firstname, lastname } = ctx;
    const values: Record<string, string> = {
      'user.firstname': firstname ?? '',
      'user.lastname': lastname ?? '',
      'user.fullname': `${firstname ?? ''} ${lastname ?? ''}`.trim(),
      'user.email': exam?.email ?? '',
      'exam.code': exam?.code ?? '',
      'exam.startedAt': exam?.userStartDate
        ? dateFormatter(new Date(exam.userStartDate))
        : '',
      'exam.finishedAt': exam?.userEndDate
        ? dateFormatter(new Date(exam.userEndDate))
        : '',
      'exam.duration': String(result?.duration ?? ''),
      'assessment.name': result?.assessmentName ?? exam?.assessmentName ?? '',
      'assessment.totalScore': String(result?.point ?? ''),
      'assessment.maxScore': String(result?.total ?? ''),
      // AssessmentEntity дээр бодитоор байгаа талбарууд (author/description/
      // usage) — exam.assessment нь ExamDao.findByCode-ийн relations:['assessment']-
      // ээр ЭХ ХАЙХГҮЙГЭЭР ачаалагддаг тул үргэлж хандах аюулгүй. AI Data
      // tab-ийн hire_mn_mapping.docx mapping schema-той нэр таарсан alias:
      'assessment.author': (exam as any)?.assessment?.author ?? '',
      'assessment.about': (exam as any)?.assessment?.description ?? '',
      'assessment.usage': (exam as any)?.assessment?.usage ?? '',
      // "Онооны хязгаар" гэдэг нь AssessmentEntity.totalPoint баганад бодитоор
      // хадгалагддаг (жиш: 40) — гараар оруулах шаардлагагүй. Энэ утга report
      // дээр шууд текст болж хэвлэгддэггүй, харин AI-д онооны хэмжигдэхүүнийг
      // зөв тайлбарлуулах context болгон дамжуулахад л ашиглагдана (жишээ:
      // 23/40 гэдгийг "clinical" эсэх гэж тодорхойлоход AI-д хэрэгтэй тоо).
      'assessment.scale': (exam as any)?.assessment?.totalPoint != null
        ? String((exam as any).assessment.totalPoint)
        : '',
      // hire_mn_mapping.docx-ийн schema "report."/"score." угтвар ашигладаг тул
      // дээрх бодит утгуудыг ижилхэн alias-аар давхар нэрлэнэ — AI Data tab-ийн
      // JSON форм дээр эдгээрийг ГАРААР ОРУУЛАХГҮЙ, автоматаар variable-аас авна.
      'report.code': exam?.code ?? '',
      // Тест дуусгасан огноо — генерацийн (өнөөдрийн) огноо биш, харин
      // exam.userEndDate (хэрэглэгч бодитоор тестээ дуусгасан цаг).
      'report.generatedAt': exam?.userEndDate ? dateFormatter(new Date(exam.userEndDate)) : '',
      'score.total': String(result?.point ?? ''),
      'score.max': String(result?.total ?? ''),
      // Онооны хувь (0–100, бүхэл) — нөхцөлт хувьсагч/хүснэгтэд ашиглана.
      'score.percent':
        result?.point != null && Number(result?.total)
          ? String(Math.round((Number(result.point) / Number(result.total)) * 100))
          : '',
      'assessment.percent':
        result?.point != null && Number(result?.total)
          ? String(Math.round((Number(result.point) / Number(result.total)) * 100))
          : '',
      // score.bandCode/bandLabel — hire_mn_mapping.docx-ийн schema-д "23 ≥ 13
      // ⇒ clinical" маягаар ТУХАЙН тестийн (жиш нь нойргүйдлийн) онооны
      // ангиллыг илэрхийлдэг ерөнхий талбар. DISC-шиг result.result/
      // result.value-тэй тест дээр эдгээрийг disc.ts-ийн ЯГ адил
      // DISC.values[result.result] lookup-оор автоматаар гаргана (D/I/S/C
      // хэв шинж = "ангилал" гэж үзвэл шууд тохирно) — result.resultCode/
      // result.styleLabel-тай яг ижил утга. AI Data tab-ийн JSON форм дээр
      // гараар бичсэн утга байвал (aiJsonData) ЭНЭ нь давамгайлж хэвээрээ
      // үлдэнэ (resolveTokens-ийн эхэнд шалгадаг), тул DISC биш тестэд
      // хэвээрээ гараар бөглөнө.
      'score.bandCode': result?.result ? result.result.toUpperCase() : '',
      'score.bandLabel':
        (result?.result &&
          (DISC as any).values?.[result.result.toLowerCase()]?.text) ||
        '',
      // score.interpretation — AI Data tab-ийн SCORE_FIELDS-ийн "Тайлбар"
      // (aiJsonData) ГАРААР бичигдээгүй л бол DISC тестэд disc.ts-ийн ЯГ
      // адил DISC.characterDescription[result.result] (урт параграф
      // тайлбар) fallback-аар орно — score.bandCode/bandLabel-тэй адилхан
      // логик. Бусад (DISC биш) тестэд хоосон, гараар бөглөнө.
      'score.interpretation':
        (result?.result &&
          (DISC as any).characterDescription?.[result.result.toLowerCase()]) ||
        '',
      'report.date': dateFormatter(new Date()),
      // DISC-шиг ангилал/хэв шинж тодорхойлдог тестэд зориулсан талбарууд.
      // result.value/result.result нь зөвхөн ийм тестэд бөглөгддөг тул бусад
      // тестэд аюулгүйгээр хоосон болно.
      // ТҮҮХИЙ (lowercase, "d"/"di" гэх мэт) DISC код — голцуу
      // {{custom.<key>[result.result]}} bracket-индексжүүлэлтэд index path
      // болгон ашиглагдана.
      'result.result': result?.result ?? '',
      'result.value': result?.value ?? '',
      'result.valueLabel':
        (result?.value && (DISC as any).enMn?.[result.value]) ||
        result?.value ||
        '',
      'result.resultCode': result?.result ? result.result.toUpperCase() : '',
      'result.styleLabel':
        (result?.result &&
          (DISC as any).values?.[result.result.toLowerCase()]?.text) ||
        '',
      // result.characterDescription — score.interpretation-тэй яг адил утга,
      // гэхдээ "result." угтвартай шууд token болгон Studio-ийн дата талбар
      // dropdown-д ("Агуулга (Эх сурвалж)") бас сонгогдож болохоор нэрлэсэн.
      'result.characterDescription':
        (result?.result &&
          (DISC as any).characterDescription?.[result.result.toLowerCase()]) ||
        '',
      // disc-trait-table хүснэгтэд бодитоор СОНГОГДСОН (тохирсон хариулттай)
      // шинж чанаруудыг тухайн ангилал (D/I/S/C) тус бүрээр — "Icon + шинж
      // тайлбар" (disc-trait-icon) блокт шууд {{result.selectedTraitsD}} гэх
      // мэтээр тавихад бодит тохирсон **шинж нэр**: тайлбар автоматаар гарна.
      'result.selectedTraitsD': this.buildSelectedTraitsText(result, 'd'),
      'result.selectedTraitsI': this.buildSelectedTraitsText(result, 'i'),
      'result.selectedTraitsS': this.buildSelectedTraitsText(result, 's'),
      'result.selectedTraitsC': this.buildSelectedTraitsText(result, 'c'),
    };
    // Бүлэг тус бүрийн үр дүн — {{category[i].<талбар>}} (i нь 1-ээс):
    //   name — бүлгийн нэр, score — бүлгийн нийт оноо, max — бүлгийн дээд
    //   оноо, avg — дундаж оноо (оноо / хариулсан асуултын тоо), percent —
    //   оноо/дээд оноо·100 (бүхэл), count — хариулсан асуултын тоо.
    const fmtNum = (n: number | null) =>
      n === null || !Number.isFinite(n) ? '' : String(Math.round(n * 100) / 100);
    values['category.count'] = String(this.currentCategoryStats.length);
    // Нийт дундаж оноо = бүх бүлгийн оноо / хариулсан асуултын тоо.
    {
      const pts = this.currentCategoryStats.reduce((a, c) => a + (Number(c.point) || 0), 0);
      const cnt = this.currentCategoryStats.reduce((a, c) => a + (Number(c.count) || 0), 0);
      values['score.avg'] = cnt ? fmtNum(pts / cnt) : '';
    }
    this.currentCategoryStats.forEach((c, i) => {
      const k = `category[${i + 1}]`;
      values[`${k}.name`] = c.categoryName ?? '';
      values[`${k}.score`] = fmtNum(c.point);
      values[`${k}.max`] = c.totalPoint ? fmtNum(c.totalPoint) : '';
      values[`${k}.avg`] = fmtNum(categoryAvg(c));
      values[`${k}.percent`] = c.totalPoint
        ? String(Math.round((c.point / c.totalPoint) * 100))
        : '';
      values[`${k}.count`] = String(c.count ?? '');
    });
    // Дэд бүлэг (хариултын ангилал) тус бүрийн үр дүн — {{answerCategory[i].<талбар>}}:
    //   name, score — нийт оноо (бүх бүлгээр), max — дээд оноо (асуултын бүтцээс),
    //   percent — оноо/дээд оноо·100 (бүхэл), avg — оноо / хариулсан асуултын тоо, count.
    values['answerCategory.count'] = String(this.currentAnswerCategories.length);
    this.currentAnswerCategories.forEach((c, i) => {
      const k = `answerCategory[${i + 1}]`;
      values[`${k}.name`] = c.name ?? '';
      values[`${k}.score`] = fmtNum(c.point);
      values[`${k}.max`] = c.max ? fmtNum(c.max) : '';
      values[`${k}.percent`] = c.max ? String(Math.round((c.point / c.max) * 100)) : '';
      values[`${k}.avg`] = fmtNum(categoryAvg(c));
      values[`${k}.count`] = String(c.count ?? '');
    });
    // Нэг "энгийн" (bracket-гүй) token-ийг эрэмбийн дагуу шийднэ: AI Data
    // JSON (aiJsonData) → хэрэглэгчийн variable (custom./result.<key>,
    // result.result-оор автоматаар шүүгдсэн) → hardcoded "values" map.
    // Нөхцөлт хувьсагчийн текст доторх token-уудыг нэг түвшин дахин шийднэ.
    const expandNested = (raw: string): string => {
      if (raw && raw.includes('{{') && this.tokenDepth < 1) {
        this.tokenDepth++;
        try {
          return this.resolveTokens(raw, ctx);
        } finally {
          this.tokenDepth--;
        }
      }
      return raw;
    };
    const resolveSimple = (key: string): string => {
      // Томьёо хувьсагч — бусад эх сурвалжаас (AI JSON г.м.) өмнө.
      const fm = key.match(/^custom\.(\w+)$/);
      if (fm && this.currentFormulas[fm[1]]) {
        return formatFormulaValue(this.formulaValue(fm[1], ctx), this.currentFormulas[fm[1]].decimals);
      }
      // {{category[g].answerCategory[i].<талбар>}} — i-р дэд бүлэг ЗӨВХӨН g-р бүлгийн асуултаар.
      const gac = key.match(/^category\[(\d+)\]\.answerCategory\[(\d+)\]\.(name|score|max|percent|avg|count)$/);
      if (gac) return this.groupAnswerCategoryValue(Number(gac[1]), Number(gac[2]), gac[3]);
      // Бодит онооны тоонууд — AI Data JSON-д (Studio-д гараар paste хийсэн,
      // статик) ижил нэртэй талбар байсан ч БОДИТ result-ийн утга давамгайлна.
      // Өмнө нь aiJsonData.score.* хоосон/хуучин утгатай бол бодит тайланд
      // "{{score.percent}}" хоосон гарч байв.
      if (REAL_FIRST_KEYS.has(key) && values[key]) return values[key];
      if ((key.startsWith('category') || key.startsWith('answerCategory')) && values[key]) return values[key];
      if (this.currentAiJsonData) {
        const jsonVal = this.getByPath(this.currentAiJsonData, key);
        if (jsonVal !== undefined && jsonVal !== null) {
          return typeof jsonVal === 'object' ? JSON.stringify(jsonVal) : String(jsonVal);
        }
      }
      if (this.currentCustomVariableTokens[key] !== undefined) {
        return expandNested(this.currentCustomVariableTokens[key]);
      }
      return values[key] !== undefined ? values[key] : '';
    };

    return normalizePdfText(content).replace(/\{\{\s*([\w.\[\]]+)\s*\}\}/g, (_m, key) => {
      // {{custom.<key>[<indexPath>]}} — ДУРЫН зам (жиш нь "result.result")-аар
      // хэрэглэгчийн variable-ийн ТҮҮХИЙ entries-ээс индексжүүлж уншина
      // (жишээ нь {{custom.characterDescription[result.result]}}) — auto
      // "result.<key>" alias-аас ялгаатай нь ЭНД indexPath-ийг хэрэглэгч
      // өөрөө сонгоно (result.result-оор хязгаарлагдахгүй).
      const bracketMatch = key.match(/^custom\.([\w]+)\[([\w.]+)\]$/);
      if (bracketMatch) {
        const [, varKey, indexPath] = bracketMatch;
        // Нөхцөлт хувьсагч + бүлгийн дугаар ({{custom.level[2]}}) — 2-р
        // бүлгийн оноогоор (Studio-д сонгосон хэмжигдэхүүнээр) нөхцлийг шалгана.
        const scoreRules = this.currentScoreRules[varKey];
        if (scoreRules && isAnswerCategorySource(scoreRules)) {
          // Дэд бүлгийн эх сурвалжтай — i-р дэд бүлгийн (хариултын ангилал) оноогоор.
          if (!/^\d+$/.test(indexPath)) return '';
          const row = this.currentAnswerCategories[Number(indexPath) - 1];
          if (!row) return '';
          return expandNested(
            evaluateScoreRulesForAnswerCategory(scoreRules, this.currentScoreInput, row),
          );
        }
        if (scoreRules) {
          if (!/^\d+$/.test(indexPath)) return '';
          const row = this.currentCategoryStats[Number(indexPath) - 1];
          if (!row) return '';
          return expandNested(
            evaluateScoreRulesForCategory(
              scoreRules,
              { ...this.currentScoreInput, categories: [row] },
              row.categoryName,
            ),
          );
        }
        const entries = this.currentCustomVariableEntries[varKey];
        if (entries) {
          const indexValue = resolveSimple(indexPath);
          const entryVal = indexValue ? entries[indexValue.toLowerCase()] : undefined;
          if (entryVal !== undefined) return entryVal;
        }
        return '';
      }
      // {{question[2656].answer}} / .answer.value / .point / .name — асуултын хариулт.
      const qm = key.match(QUESTION_TOKEN_KEY_RE);
      if (qm) {
        if (this.demoMode) return qm[2] === 'point' ? '3' : qm[2] === 'name' ? `Асуулт #${qm[1]}` : `‹асуулт #${qm[1]}-ийн хариулт›`;
        return questionTokenValue(this.currentQuestionAnswers.get(Number(qm[1])), qm[2]);
      }
      return resolveSimple(key);
    });
  }

  // Ангилал тус бүрийн оноо (score-section/list-item/category-list/graph
  // блокуудад хэрэглэгдэнэ) — нэг render-д зөвхөн НЭГ удаа татна.
  private categoriesCache = new Map<
    string,
    { categoryName: string; point: number; totalPoint: number }[]
  >();
  private async getCategories(result: ResultEntity) {
    // Studio-ийн "PDF-ээр урьдчилан харах" (demo) — бодит хариулт байхгүй тул
    // demo бүлгүүдээр (Canvas-тай ижил) радар/багана/оноо мөрүүдийг зурна.
    if (this.demoMode) {
      return this.currentCategoryStats.map((c) => ({
        categoryName: c.categoryName,
        point: c.point,
        totalPoint: c.totalPoint,
      }));
    }
    const key = `${result.code}:${result.type}`;
    if (this.categoriesCache.has(key)) return this.categoriesCache.get(key)!;
    const rows = await this.userAnswer.partialCalculator(
      result.code,
      result.type,
    );
    this.categoriesCache.set(key, rows);
    return rows;
  }

  // Томьёо хувьсагчийн утга. Томьёо дотор өөр томьёо ({{custom.x}}) дуудаж болно —
  // тэдгээрийг тоймлолгүй (бүтэн) утгаар нь авна. Тойрог (a → b → a) бол null.
  private formulaValue(key: string, ctx: RenderCtx): number | null {
    if (this.formulaCache.has(key)) return this.formulaCache.get(key)!;
    const f = this.currentFormulas[key];
    if (!f || this.formulaStack.has(key)) return null;
    this.formulaStack.add(key);
    let v: number | null = null;
    try {
      v = evalNumberExpression(f.expression, (k) => {
        const m = k.match(/^custom\.(\w+)$/);
        if (m && this.currentFormulas[m[1]]) {
          const sub = this.formulaValue(m[1], ctx);
          return sub === null ? '' : String(sub);
        }
        return this.resolveTokens(`{{${k}}}`, ctx);
      });
    } finally {
      this.formulaStack.delete(key);
    }
    this.formulaCache.set(key, v);
    return v;
  }

  // "custom.key" эсвэл хувьсагчийн "Харагдах нэр" → key.
  private scoreVarKey(left: string): string | null {
    const t = (left || '').trim();
    const m = t.match(/^custom\.(\w+)$/);
    if (m) return m[1];
    const want = t.replace(/\s+/g, ' ').toLowerCase();
    const hit = this.currentCustomNames.find(
      (c) => (c.label || '').trim().replace(/\s+/g, ' ').toLowerCase() === want,
    );
    return hit ? hit.key : null;
  }

  private demoCategories(template: any) {
    const src: any[] = Array.isArray(template?.demoData?.categories) && template.demoData.categories.length
      ? template.demoData.categories
      : [
          { name: 'Харилцааны ур чадвар', score: 82, maxScore: 100, count: 20 },
          { name: 'Шийдвэр гаргах', score: 74, maxScore: 100, count: 20 },
          { name: 'Баг удирдлага', score: 68, maxScore: 100, count: 20 },
          { name: 'Стратегийн сэтгэлгээ', score: 79, maxScore: 100, count: 20 },
        ];
    return src.map((c) => ({
      categoryName: String(c.name ?? ''),
      point: Number(c.score) || 0,
      totalPoint: Number(c.maxScore) || 0,
      count: c.count != null ? Number(c.count) || 0 : 20,
    }));
  }

  async render(
    doc: PDFKit.PDFDocument,
    template: PdfTemplateEntity,
    ctx: RenderCtx,
    assetService: AssetsService,
  ) {
    this.categoriesCache.clear();
    // AI Data tab-ийн JSON өгөгдөл — тухайн template дээр хадгалагдсан бол
    // resolveTokens() үүнийг эхэнд шалгана (Studio preview-тэй нийцтэй).
    this.currentAiJsonData = (template as any).aiJsonData || null;
    const pages = template.pages ?? [];
    const { result, exam, firstname, lastname } = ctx;

    // Хэрэглэгчийн variable (assessment_variable) — assessment.id-аар БҮХ
    // named map-ийг татаж, тухайн exam-ийн result.result (D/I/S/C гэх мэт)
    // утгаар entries-ээс тохирох мөрийг сонгож "custom.<key>" token
    // болгоно. exam.assessment ExamDao.findByCode-ийн relations:['assessment']-
    // ээр аль хэдийн ачаалагддаг тул үргэлж хандах аюулгүй.
    this.currentCustomVariableTokens = {};
    this.currentCustomVariableEntries = {};
    this.currentScoreRules = {};
    this.currentCustomNames = [];
    this.currentFormulas = {};
    this.formulaCache.clear();
    this.formulaStack.clear();
    this.demoMode = result?.code === 'DEMO-PREVIEW';
    this.currentResultCode = result?.code ?? null;
    this.answerStatsCache = null;
    // Хариултын ангиллын оноо ({{Хариулт[…]}} token, дугуй радар) — нэг query.
    this.currentAnswerStats =
      !this.demoMode && this.currentResultCode ? await this.answerStats() : [];
    // Бүлэг тус бүрийн үр дүн — нэг жижиг query, token/нөхцөлт хувьсагчид.
    // Demo preview-д Studio-ийн demo бүлгүүд (template.demoData.categories).
    this.currentCategoryStats = this.demoMode
      ? this.demoCategories(template)
      : result
        ? await this.userAnswer.categoryStats(
            result.code,
            result.type,
            Number((result as any).assessment ?? (exam as any)?.assessment?.id) || null,
          ).catch((e) => {
            console.warn('[DynamicTemplateRenderer] categoryStats алдаа', e);
            return [];
          })
        : [];
    // {{question[<id>].answer}} — асуулт тус бүрийн хариулт (demo-д бодит хариулт байхгүй).
    this.currentQuestionAnswers =
      !this.demoMode && this.currentResultCode
        ? groupQuestionAnswers(
            await this.userAnswer.questionAnswers(this.currentResultCode).catch((e) => {
              console.warn('[DynamicTemplateRenderer] questionAnswers алдаа', e);
              return [];
            }),
          )
        : new Map();
    // Дэд бүлгүүд (хариултын ангилал) — тестийн бүх ангилал id дарааллаар, хариулаагүй нь 0.
    this.currentAnswerCategories = await this.loadAnswerCategories(
      (exam as any)?.assessment?.id ?? (template as any)?.assessmentId,
    );
    this.currentScoreInput = {
      point: result?.point != null ? Number(result.point) : null,
      total: result?.total != null ? Number(result.total) : null,
      categories: this.currentCategoryStats,
      answerCategories: this.currentAnswerCategories,
      // "Бүлэг / дэд бүлгийн дундаж оноо" эх сурвалжтай нөхцөлт хувьсагчид.
      groupValue: (group: string, sub?: string) => {
        const g = (group || '').trim();
        const s2 = (sub || '').trim();
        if (this.demoMode) return answerDemoValue(s2 ? (g ? `${g}/${s2}` : s2) : g);
        if (s2) {
          if (!g) return groupTokenValue('Дэд бүлэг', s2, undefined, this.currentCategoryStats, this.currentAnswerStats);
          // Хувьсагчийн "Бүлэг" талбарт дэд бүлэг (Гүйцэтгэл), [ ] дотор бүлэг (Багын оролцоо)
          // бичсэн ч ажиллана — эхлээд G/S, олдохгүй бол S/G.
          return (
            groupTokenValue('Бүлэг', `${g}/${s2}`, undefined, this.currentCategoryStats, this.currentAnswerStats) ??
            groupTokenValue('Бүлэг', `${s2}/${g}`, undefined, this.currentCategoryStats, this.currentAnswerStats)
          );
        }
        if (!g) return null;
        return groupTokenValue('Бүлэг', g, undefined, this.currentCategoryStats, this.currentAnswerStats);
      },
    };
    const assessmentId = (exam as any)?.assessment?.id;
    if (assessmentId) {
      try {
        const variables = await this.variableDao.findAllByAssessmentId(assessmentId);
        const resultKey = result?.result ? result.result.toLowerCase() : undefined;
        this.currentCustomNames = variables.map((v) => ({ key: v.key, label: (v as any).label }));
        // Томьёо хувьсагчдыг ЭХЛЭЭД бүртгэнэ — нөхцөлт хувьсагч ("variable" эх сурвалж) тэдгээрийн
        // утгыг дарааллаас үл хамааран шалгадаг.
        for (const v of variables) {
          const r: any = (v as any).rules;
          if (v.kind === 'formula' && r?.expression) {
            this.currentFormulas[v.key] = { expression: String(r.expression), decimals: Number(r.decimals) || 0 };
          }
        }
        this.currentScoreInput.variableValue = (k: string) => this.formulaValue(k, ctx);
        for (const v of variables) {
          if (v.kind === 'formula') continue;
          if (v.kind === 'score') {
            // Нөхцөлт хувьсагч — оноо/хувиар нөхцлүүдийг шалгаж текст сонгоно.
            this.currentScoreRules[v.key] = v.rules;
            this.currentCustomVariableTokens[`custom.${v.key}`] = evaluateScoreRules(
              v.rules,
              this.currentScoreInput,
            );
            continue;
          }
          this.currentCustomVariableEntries[v.key] = v.entries || {};
          const value = resultKey ? v.entries?.[resultKey] : undefined;
          // "custom.<key>" — үргэлж тодорхойлогдоно (тохирох entry ологдоогүй
          // бол хоосон), учир нь энэ namespace-д цаашид өөр fallback байхгүй.
          this.currentCustomVariableTokens[`custom.${v.key}`] = value ?? '';
          // "result.<key>" (жиш нь {{result.characterDescription}}) — ЗӨВХӨН
          // бодит тохирох entry байгаа үед л бүртгэнэ. Ингэснээр тохирох
          // entry байхгүй тохиолдолд resolveTokens доторх hardcoded
          // DISC.characterDescription fallback ("values" map) руу зөв
          // унана — хоосон утгаар албадан дарж бичихгүй.
          if (value !== undefined) {
            this.currentCustomVariableTokens[`result.${v.key}`] = value;
          }
        }
      } catch (e) {
        console.warn('[DynamicTemplateRenderer] assessment_variable ачаалахад алдаа гарлаа', e);
      }
    }

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const blocks = [...(page.blocks ?? [])].sort((a, b) => a.y - b.y);

      // ── cover: home() нь бүтэн хуудсыг өөрөө будаж дуусгадаг тул тухайн
      // хуудасны цорын ганц агуулга гэж үзнэ (studio-ийн үндсэн загварт ч
      // cover үргэлж дангаараа нэг хуудсанд байдаг).
      // ⚠ template.name БОЛ зөвхөн studio дотор загварыг ялгах/таних
      // зорилготой дотоод нэр — тайлан дээр харагдах гарчиг биш. Тайлангийн
      // гарчигт үргэлж жинхэнэ assessment.name (result/exam.assessmentName)
      // орно.
      const coverBlock = blocks.find((b) => b.type === 'cover');
      if (coverBlock) {
        const coverReplace = makeTextReplacer('cover', (coverBlock as any).texts, (t) => this.resolveTokens(t, ctx));
        const dAny: any = doc;
        const origText = dAny.text, origWidth = dAny.widthOfString;
        if (coverReplace) {
          dAny.text = function (t: any, ...a: any[]) {
            return origText.call(this, typeof t === 'string' ? coverReplace(t) : t, ...a);
          };
          dAny.widthOfString = function (t: any, ...a: any[]) {
            return origWidth.call(this, typeof t === 'string' ? coverReplace(t) : t, ...a);
          };
        }
        try {
        home(
          doc,
          assetService,
          lastname ?? '',
          firstname ?? '',
          result?.assessmentName || exam?.assessmentName || '',
          exam?.code ?? '',
        );
        } finally {
          dAny.text = origText;
          dAny.widthOfString = origWidth;
        }
        if (pageIndex < pages.length - 1) doc.addPage();
        continue;
      }

      // home() (cover) нь doc.lineGap(0.15)-ийг БҮХ баримтад тавьдаг тул
      // дараагийн хуудсуудын текст Studio Canvas-аас мөр бүрт 0.15pt илүү
      // зайтай гардаг байв — Studio-той яг ижил байлгахын тулд буцаана.
      doc.lineGap(0);

      if (page.backgroundColor && page.backgroundColor.toUpperCase() !== '#FFFFFF') {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(page.backgroundColor);
        doc.fillColor(colors.black);
      }

      // Тухайн хуудсанд ТУСДАА "user-name" блок нэмсэн бол header/title10
      // built-in avatar+нэрийг давхардуулахгүй байх ёстой — studio дээр
      // хэрэглэгч эдгээрийг хамт ашигласан гэдгийг энд илрүүлнэ.
      const pageHasUserName = blocks.some((b) => b.type === 'user-name');

      for (const block of blocks) {
        const __tBlock = Date.now();
        try {
          // Өмнөх блок PDFKit-ийн "continued" текстийг (алдаа гэх мэтээр)
          // дуусгаагүй үлдээсэн бол дараагийн doc.text() тэр wrapper-ийг
          // (өөр өргөн, continuedX) өвлөж, өргөн нь ≤0 болоход PDFKit-ийн
          // мөр таслагч мөнхийн давталтад орж процессыг бүхэлд нь гацаадаг.
          (doc as any)._wrapper = null;
          (doc as any)._textOptions = null;
          // Studio-д өөрчилсөн тогтмол бичвэрүүд (block.texts — block-texts.ts).
          await this.withTextOverrides(doc, block, ctx, () =>
            this.renderBlock(doc, block, ctx, assetService, pageHasUserName),
          );
        } catch (err) {
          // Нэг блок амжилтгүй болсноор бүх тайлан унахгүй — алгасаад үргэлжлүүлнэ.
          console.warn(
            `[DynamicTemplateRenderer] block "${block.type}" (id=${block.id}) failed:`,
            err?.message ?? err,
          );
        }
        const __ms = Date.now() - __tBlock;
        if (__ms > 1000) {
          console.warn(
            `[DynamicTemplateRenderer] SLOW block "${block.type}" (id=${block.id}) ${__ms}ms page=${pageIndex + 1} x=${block.x} y=${block.y} w=${block.width}`,
          );
        }
      }

      if (pageIndex < pages.length - 1) doc.addPage();
    }
  }

  // header/title10/footer/cover нь studio-ийн canvas дээр ч чирж
  // байрлуулдаггүй, бүтэн өргөнтэй, хуудасны тогтмол цэг дээр (дээр/доор)
  // байрладаг "fixture" блокууд (Canvas.tsx-ийн isFullWidth жагсаалттай
  // яг тохирно) — эдгээрт block.x/y хэрэглэхгүй. Бусад бүх блок studio
  // canvas-даа хаана байсан яг тэр цэгээс (doc.x=block.x, doc.y=block.y)
  // зурж эхэлнэ.
  // block.texts (Studio "Текстүүд") — блок зурах хугацаанд doc.text / widthOfString /
  // heightOfString-д ирсэн тогтмол бичвэрийг солино. PDFKit-ийн дотоод (мөр таслах)
  // дуудлагад давхар солихгүйн тулд depth тоолуур.
  private async withTextOverrides(doc: PDFKit.PDFDocument, block: any, ctx: RenderCtx, fn: () => Promise<void>) {
    const replace = makeTextReplacer(block?.type, block?.texts, (t) => this.resolveTokens(t, ctx));
    if (!replace) return fn();
    const d: any = doc;
    const t0 = d.text, w0 = d.widthOfString, h0 = d.heightOfString;
    let depth = 0;
    const wrap = (orig: any) =>
      function (this: any, s: any, ...a: any[]) {
        const arg = depth === 0 && typeof s === 'string' ? replace(s) : s;
        depth++;
        try {
          return orig.call(this, arg, ...a);
        } finally {
          depth--;
        }
      };
    d.text = wrap(t0);
    d.widthOfString = wrap(w0);
    d.heightOfString = wrap(h0);
    try {
      await fn();
    } finally {
      d.text = t0;
      d.widthOfString = w0;
      d.heightOfString = h0;
    }
  }

  private static readonly FIXED_POSITION_TYPES = new Set([
    'header',
    'title10',
    'footer',
    'cover',
  ]);

  private async renderBlock(
    doc: PDFKit.PDFDocument,
    block: any,
    ctx: RenderCtx,
    assetService: AssetsService,
    pageHasUserName = false,
  ) {
    const { result, exam, firstname, lastname } = ctx;
    const assessment = exam?.assessment as any;

    if (
      !DynamicTemplateRenderer.FIXED_POSITION_TYPES.has(block.type) &&
      typeof block.x === 'number' &&
      typeof block.y === 'number'
    ) {
      doc.x = block.x;
      doc.y = block.y;
    }

    const blockWidth = typeof block.width === 'number' ? block.width : undefined;

    switch (block.type) {
      case 'header': {
        const assessmentTitle = block.content
          ? this.resolveTokens(block.content, ctx)
          : undefined;
        // pageHasUserName=true бол давхардуулахгүйн тулд built-in нэрийг
        // унтраана — хэрэглэгч тусдаа "user-name" блокоор өөрөө байрлуулна.
        header(doc, firstname ?? '', lastname ?? '', assetService, assessmentTitle, !pageHasUserName);
        break;
      }
      case 'title10': {
        // Studio-ийн "Дэлгэрэнгүй толгой хэсэг" — тестийн нэргүй (гарчгийг "Тестийн нэр"
        // блокоор тусад нь нэмнэ). Хуучин кодоор бичсэн тайлангууд title10-ийг нэртэй дуудна.
        title10(doc, assetService, firstname ?? '', lastname ?? '', undefined, !pageHasUserName);
        break;
      }
      case 'title': {
        // block.content тавигдсан бол ЧӨЛӨӨТ гарчиг болгож ашиглана (жишээ нь
        // "Оршил") — жинхэнэ formatter.ts→title() функц нь эхнээсээ ямар ч
        // текст авдаг (assessment.name-д хатуу холбогдоогүй), зөвхөн миний
        // энд дуудах утга нь хатуу байсан тул одоо чөлөөтэй болгов.
        // Тавиагүй бол өмнөх шигээ жинхэнэ assessment нэрийг л харуулна.
        const customTitle = this.resolveTokens(block.content, ctx);
        const titleText = customTitle || (result?.assessmentName ?? exam?.assessmentName);
        // showAuthor=false (Studio: "Зохиогч: Оруулахгүй") бол зохиогчийн мөргүй.
        title(
          doc,
          assetService,
          titleText,
          block.showAuthor === false ? undefined : assessment?.author,
          Number(block.titleFontSize) > 0 ? Number(block.titleFontSize) : undefined,
          Number(block.authorFontSize) > 0 ? Number(block.authorFontSize) : undefined,
        );
        break;
      }
      case 'user-name': {
        // header()/title10() дотор built-in байдаг "Шалгуулагч + нэр" хэсгийг
        // ТУСДАА, block.x/y дээр зурна (header()/title10()-ийг бүхэлд нь
        // дуудахгүй тул давхарлагдахгүй). Studio-ийн ReportUserName
        // (Canvas.tsx) preview-тэй яг ижил дизайн — зөвхөн avatar+нэр
        // (Canvas.tsx-д оранж шугам ЗУРАГДДАГГҮЙ тул энд ч зурахгүй).
        const bx = doc.x;
        const by = doc.y;

        const rowY = by + 8; // Canvas.tsx-ийн paddingTop: 8-тэй тохирно
        const cx = bx + 16;
        const cy = rowY + 16;
        doc.circle(cx, cy, 16).fill(colors.circlebg);
        const initial = (firstname ?? '').charAt(0).toUpperCase();
        this.safeFont(doc, undefined, true);
        doc
          .fillColor(colors.orange)
          .fontSize(16)
          .text(initial, cx - 8, cy - 7.5, { width: 16, align: 'center' });
        const nameX = bx + 42;
        this.safeFont(doc, undefined, false);
        doc.fillColor(colors.black).fontSize(11).text('Шалгуулагч', nameX, rowY + 2);
        this.safeFont(doc, undefined, true);
        doc
          .fillColor(colors.black)
          .fontSize(13)
          .text(`${lastname ?? ''} ${firstname ?? ''}`.trim(), nameX, rowY + 16);
        break;
      }
      case 'info': {
        // Studio-ийн "Мэдээлэл" блок (ReportInfo) = тестийн нэр + доогуур зураас (ReportTitle)
        // + зохиогч, тайлбар, хэмжих зүйлс, хэрэглээ. Хуучин тайлангуудын
        // title(doc, service, name) → info(...) дараалалтай ижил — өмнө нь энд зөвхөн
        // info() дуудагдаж, PDF дээр тестийн нэр огт гардаггүй байв.
        doc.y += 16; // Studio ReportInfo-ийн paddingTop: 16
        title(doc, assetService, result?.assessmentName ?? exam?.assessmentName ?? undefined);
        info(
          doc,
          assetService,
          assessment?.author,
          assessment?.description,
          assessment?.measure,
          assessment?.usage,
        );
        break;
      }
      case 'section-header': {
        const text = this.resolveTokens(block.content, ctx) || 'Үр дүн';
        this.drawSectionHeaderLine(doc, text, block.x ?? marginX);
        break;
      }
      case 'score-default': {
        await this.single.default(doc, result, assetService);
        break;
      }
      case 'score-summary': {
        // section-header + score-default нэг блокоор — studio-ийн
        // ReportScoreSummary (Canvas.tsx) preview-тэй яг ижил.
        const text = this.resolveTokens(block.content, ctx) || 'Үр дүн';
        this.drawSectionHeaderLine(doc, text, block.x ?? marginX);
        await this.single.default(doc, result, assetService);
        break;
      }
      case 'quartile': {
        // Studio-ийн 'quartile' блок зөвхөн дээд bell-curve график + хувийн
        // хувь хэмжээний хураангуйг харуулна — "Дэлгэрэнгүй үр дүн" хэсгийг
        // ЭНД БИШ, ТУСДАА 'quartile-detail' блокоор удирдана (доор харна уу).
        await this.single.examQuartile(doc, result, undefined, false);
        break;
      }
      case 'quartile-detail': {
        // "Дэлгэрэнгүй үр дүн" гарчиг + ангилал тус бүрийн оноо мөр — quartile
        // блокоос тусад нь чөлөөтэй байрлуулж болно.
        const text = this.resolveTokens(block.content, ctx) || 'Дэлгэрэнгүй үр дүн';
        this.drawSectionHeaderLine(doc, text, block.x ?? marginX);
        const rows = await this.getCategories(result);
        for (const row of rows) {
          await this.single.section(doc, row.categoryName, row.totalPoint, row.point);
        }
        break;
      }
      case 'score-section': {
        const rows = await this.getCategories(result);
        for (const row of rows) {
          await this.single.section(doc, row.categoryName, row.totalPoint, row.point);
        }
        break;
      }
      case 'category-list': {
        const rows = await this.getCategories(result);
        for (const row of rows) {
          this.single.list(doc, row.categoryName, `${row.point}/${row.totalPoint}`);
        }
        break;
      }
      case 'list-item': {
        const label = this.resolveTokens(block.content, ctx) || block.label || '';
        const value = block.dataField
          ? this.resolveTokens(`{{${block.dataField}}}`, ctx)
          : '';
        this.single.list(doc, label, value);
        break;
      }
      case 'heading': {
        // Default төлөв: "Оршил" маягийн section-header-той төстэй orange
        // текст + доор нь богино шугам (block.style.color тавьсан бол зөвхөн
        // өнгө нь дарагдана, шугам мөн л зурагдана).
        const text = this.resolveTokens(block.content, ctx) || block.label || '';
        const headingX = doc.x;
        const headingAlign = (block.style?.textAlign as any) || 'left';
        // Анхдагч / "Gilroy" → тод (fontBold). Studio-д "Gilroy Medium" / "Bold" / "Black"
        // сонгосон бол яг тэр фонтоор (Studio Canvas-тай ижил).
        const headingFont = block.style?.fontFamily;
        if (headingFont && ['fontMedium', 'fontBold', 'fontBlack'].includes(headingFont)) doc.font(headingFont);
        else this.safeFont(doc, headingFont, true);
        doc
          .fontSize(block.style?.fontSize || 16)
          .fillColor(block.style?.color || colors.orange)
          .text(text, headingX, doc.y, { width: blockWidth, align: headingAlign });
        // Зүүн зэрэгцүүлэлтийн үед л дэд шугам гарчигтай зэрэгцэнэ — төв/баруун
        // үед бол доод шугамыг гарчгийн бодит текстийн эхлэлд биш харин
        // блокийн эхэнд зурсаар үлдээнэ (энгийн, урьдчилан тооцоолохгүй).
        // Зузаан 1pt-г тодорхой тавина (Studio Canvas: 1px, doc.y + 1.5-аас эхэлнэ).
        doc
          .moveTo(headingX, doc.y + 2)
          .lineWidth(1)
          .strokeColor(block.style?.color || colors.orange)
          .lineTo(headingX + 60, doc.y + 2)
          .stroke();
        break;
      }
      case 'text': {
        const text = this.resolveTokens(block.content, ctx);
        if (!text) break;
        const baseColor = block.style?.color || colors.black;
        // seg.link > seg.accent > boldColor (**тод**/~~хар~~ сегментийн тусдаа
        // өнгө, тавигдсан бол) > энгийн текст өнгө — эрэмбийн дагуу шийднэ.
        const segColor = (seg: { accent?: boolean; accentColor?: string; bold?: boolean; black?: boolean; link?: string }) =>
          seg.link && !seg.accent
            ? LINK_COLOR
            : seg.accent
              ? seg.accentColor || colors.orange
              : (seg.bold || seg.black) && block.style?.boldColor
                ? block.style.boldColor
                : baseColor;
        // Studio Canvas-тай ЯГ адил: фонт 12 (анхдагч), мөрийн өндөр
        // style.lineHeight эсвэл Gilroy-ийн "normal" 1.213 (Canvas-ийн
        // PDF_LINE_HEIGHT), мөр таслалт Chrome-ийн pre-wrap дүрмээр
        // (rich-layout.ts).
        const fontSize = Number(block.style?.fontSize) || 12;
        const lineHeight = Number(block.style?.lineHeight) > 0 ? Number(block.style.lineHeight) : DEFAULT_LINE_HEIGHT;
        const family = block.style?.fontFamily;
        const setFont = (seg: RichSeg) =>
          this.safeFontWeight(doc, family, seg.black ? 'black' : seg.bold ? 'bold' : 'normal', !!seg.italic);
        const drawOpts = { colorOf: segColor as any, ascent: GILROY_ASCENT, descent: GILROY_DESCENT };
        let x0 = typeof block.x === 'number' ? block.x : marginX;
        let y0 = typeof block.y === 'number' ? block.y : doc.y;
        let width = blockWidth || doc.page.width - x0 - marginX;

        // Дэвсгэр өнгө (Studio: "Дэвсгэр өнгө", дотор зай анхдагч 8, булан) — эхлээд
        // агуулгын өндрийг хэмжиж (зурахгүй) тэгш өнцөгт будаад, текстийг дотор зайтай зурна.
        const bgColor = typeof block.style?.backgroundColor === 'string' && block.style.backgroundColor.trim()
          ? block.style.backgroundColor.trim()
          : null;
        if (bgColor && bgColor.toLowerCase() !== 'transparent') {
          const pad = Number.isFinite(Number(block.style?.padding)) ? Math.max(0, Number(block.style.padding)) : 8;
          const radius = Math.max(0, Number(block.style?.borderRadius) || 0);
          const innerW = Math.max(1, width - pad * 2);
          let contentH = 0;
          if (block.style?.listStyle === 'list') {
            this.safeFont(doc, family, false);
            doc.fontSize(fontSize);
            const bulletIndent = doc.widthOfString('•') + 6;
            const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
            items.forEach((item, idx) => {
              contentH +=
                layoutRichText(doc, parseRichTextSegments(item), {
                  width: Math.max(1, innerW - bulletIndent),
                  fontSize,
                  lineHeight,
                  align: 'left',
                  setFont,
                }).height + (idx < items.length - 1 ? 4 : 0);
            });
          } else if (block.style?.listStyle === 'numbered') {
            const paras = splitNumberedParagraphs(text);
            this.safeFont(doc, family, false);
            doc.fontSize(fontSize);
            const markerW = Math.max(0, ...paras.filter((p) => p.marker).map((p) => doc.widthOfString(p.marker!)));
            const indent = markerW ? markerW + 6 : 0;
            paras.forEach((p, idx) => {
              contentH +=
                layoutRichText(doc, parseRichTextSegments(p.text), {
                  width: Math.max(1, innerW - indent),
                  fontSize,
                  lineHeight,
                  align: (block.style?.textAlign as any) || 'left',
                  setFont,
                }).height + (idx < paras.length - 1 ? 4 : 0);
            });
          } else {
            contentH = layoutRichText(doc, parseRichTextSegments(text), {
              width: innerW,
              fontSize,
              lineHeight,
              align: (block.style?.textAlign as any) || 'left',
              setFont,
              leaders: true,
            }).height;
          }
          doc.save();
          if (radius > 0) doc.roundedRect(x0, y0, width, contentH + pad * 2, radius).fill(bgColor);
          else doc.rect(x0, y0, width, contentH + pad * 2).fill(bgColor);
          doc.restore();
          x0 += pad;
          y0 += pad;
          width = innerW;
        }

        // "Жагсаалт" формат — content-ийн мөр (\n) бүрийг урд нь "•" bullet-тэй
        // жагсаалтын мөр болгоно. Canvas: bullet + 6px зай (gap-1.5), мөр
        // хоорондын 4px (gap-1).
        if (block.style?.listStyle === 'list') {
          this.safeFont(doc, family, false);
          doc.fontSize(fontSize);
          const bulletIndent = doc.widthOfString('•') + 6;
          const itemWidth = Math.max(1, width - bulletIndent);
          const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
          let y = y0;
          items.forEach((item, idx) => {
            const layout = layoutRichText(doc, parseRichTextSegments(item), {
              width: itemWidth,
              fontSize,
              lineHeight,
              align: 'left',
              setFont,
            });
            // bullet — эхний мөртэй ижил босоо байрлалд
            // Canvas: bullet span-ийн line-height "normal" (1.213)
            const bulletLayout = layoutRichText(doc, [{ text: '•' }], { width: bulletIndent, fontSize, lineHeight: DEFAULT_LINE_HEIGHT, setFont });
            drawRichText(doc, bulletLayout, x0, y, { ...drawOpts, colorOf: () => baseColor });
            drawRichText(doc, layout, x0 + bulletIndent, y, drawOpts);
            y += layout.height + (idx < items.length - 1 ? 4 : 0);
          });
          doc.fillColor(colors.black);
          doc.font(fontNormal);
          doc.x = x0;
          doc.y = y;
          break;
        }

        // "Дугаартай жагсаалт" — "Жагсаалт (•)"-тэй адил, bullet-ийн оронд
        // 1., 2., … дугаар; текст догол зайнаас (hanging indent). Canvas.tsx-ийн
        // CSS grid (max-content | 1fr, баганын зай 6px, мөр хооронд 4px)-тэй
        // WYSIWYG: догол = хамгийн өргөн дугаар + 6pt.
        if (block.style?.listStyle === 'numbered') {
          const paras = splitNumberedParagraphs(text);
          this.safeFont(doc, family, false);
          doc.fontSize(fontSize);
          const markerW = Math.max(
            0,
            ...paras.filter((p) => p.marker).map((p) => doc.widthOfString(p.marker!)),
          );
          const indent = markerW ? markerW + 6 : 0;
          const align = (block.style?.textAlign as any) || 'left';
          const itemWidth = Math.max(1, width - indent);
          let y = y0;
          paras.forEach((p, idx) => {
            const layout = layoutRichText(doc, parseRichTextSegments(p.text), {
              width: itemWidth,
              fontSize,
              lineHeight,
              align,
              setFont,
            });
            if (p.marker) {
              const markerLayout = layoutRichText(doc, [{ text: p.marker }], {
                width: indent + 50,
                fontSize,
                lineHeight,
                setFont,
              });
              drawRichText(doc, markerLayout, x0, y, { ...drawOpts, colorOf: () => baseColor });
            }
            drawRichText(doc, layout, x0 + indent, y, drawOpts);
            y += layout.height + (idx < paras.length - 1 ? 4 : 0);
          });
          doc.fillColor(colors.black);
          doc.font(fontNormal);
          doc.x = x0;
          doc.y = y;
          break;
        }

        try {
          const layout = layoutRichText(doc, parseRichTextSegments(text), {
            width,
            fontSize,
            lineHeight,
            align: (block.style?.textAlign as any) || 'left',
            setFont,
            leaders: true,
          });
          drawRichText(doc, layout, x0, y0, drawOpts);
          doc.y = y0 + layout.height;
        } catch (err) {
          // Хамгаалалт: шинэ layout-д ямар нэг алдаа гарвал блокыг алгасахын
          // оронд тэмдэглэгээгүй энгийн текстээр ч гэсэн зурна.
          console.warn('[DynamicTemplateRenderer] rich layout failed, plain fallback:', err?.message ?? err);
          const plain = parseRichTextSegments(text).map((s) => s.text).join('');
          (doc as any)._wrapper = null;
          (doc as any)._textOptions = null;
          this.safeFont(doc, family, false);
          doc.fontSize(fontSize).fillColor(baseColor).text(plain, x0, y0, { width, lineBreak: true });
        }
        doc.fillColor(colors.black);
        doc.font(fontNormal);
        doc.x = x0;
        break;
      }
      case 'table': {
        this.renderTable(doc, block, ctx);
        break;
      }
      case 'ai-conclusion': {
        // Live AI generation энэ шатанд холбогдоогүй — зөвхөн studio дээр
        // урьдчилан бичсэн/хадгалсан текст байвал хэвлэнэ.
        const text = this.resolveTokens(block.content, ctx);
        if (!text) {
          console.warn('[DynamicTemplateRenderer] ai-conclusion block has no static content — skipped (live AI generation not wired yet)');
          break;
        }
        this.safeFont(doc, undefined, false);
        doc
          .fontSize(block.style?.fontSize || 12)
          .fillColor(block.style?.color || colors.black)
          .text(text, doc.x, doc.y, {
            align: 'justify',
            width: blockWidth || doc.page.width - (block.x ?? marginX) - marginX,
          });
        break;
      }
      case 'image':
      case 'icon':
      case 'chart': {
        await this.renderGraphic(doc, block, ctx, assetService);
        break;
      }
      case 'wheel-radar': {
        await this.renderWheel(doc, block, ctx);
        break;
      }
      case 'level-cards': {
        this.renderLevelCards(doc, block, ctx);
        break;
      }
      case 'progress-bar': {
        this.renderProgressBar(doc, block, ctx);
        break;
      }
      case 'custom-chart': {
        this.renderCustomChart(doc, block, ctx);
        break;
      }
      case 'shape': {
        this.renderShape(doc, block);
        break;
      }
      case 'footer': {
        footer(doc);
        break;
      }
      case 'disc-trait-table': {
        // reports/disc.ts-ийн "Үе шат II: Хүчний индекс" хүснэгттэй ЯГ
        // адил — 4 өнгөт толгой мөр + DISC.description.d/i/s/c-ийн 28-1
        // зэрэглэсэн шинж чанар багана бүрт, result.details-ээр (хэрэглэгчийн
        // бодитоор сонгосон шинж) тухайн баганы өнгөөр тод/өнгөтэй болгоно.
        // Мөр бүрийн өндөр текстийн бодит уртаас хамаарч хувьсдаг тул
        // block.height-тэй яг таарахгүй байж болно — дараагийн блокийг
        // (жиш нь footer-ээс бусад) энэ доор шууд байрлуулахгүй, тусдаа
        // хуудсанд эсвэл хангалттай зайтай байрлуулна уу.
        const tableX = block.x ?? marginX;
        const tableWidth = blockWidth || doc.page.width - tableX - marginX;
        const colWidth = tableWidth / 4;
        const startY = doc.y;

        doc.font('fontBlack').fontSize(10);
        const discHeaders = [
          { text: 'Давамгайлагч (D)', color: colors.green },
          { text: 'Нөлөөлөгч (I)', color: colors.redSecondary },
          { text: 'Туйлбартай (S)', color: colors.blue },
          { text: 'Нягт нямбай (C)', color: colors.yellow },
        ];
        discHeaders.forEach((h, index) => {
          doc.rect(tableX + colWidth * index, startY, colWidth, 25).fill(h.color);
          doc
            .fillColor('white')
            .text(h.text, tableX + colWidth * index, startY + 7.5, {
              width: colWidth,
              align: 'center',
            });
        });

        doc.font(fontNormal).fontSize(8);
        let rowY = startY + 25;
        const baseRowHeight = 17.3;

        const details: any[] = (result as any)?.details || [];
        const groupedDetails: Record<string, any[]> = {};
        for (const item of details) {
          if (!groupedDetails[item.category]) groupedDetails[item.category] = [];
          groupedDetails[item.category].push(item);
        }

        const traits: Record<string, string[]> = {
          d: Object.keys((DISC as any).description?.d ?? {}),
          i: Object.keys((DISC as any).description?.i ?? {}),
          s: Object.keys((DISC as any).description?.s ?? {}),
          c: Object.keys((DISC as any).description?.c ?? {}),
        };

        const boldIfMatched = (trait: string, category: string) =>
          groupedDetails[category]?.some((item) => item.value === trait);

        const maxTraits = Math.max(0, ...Object.values(traits).map((t) => t.length));

        for (let i = 0; i < maxTraits; i++) {
          let maxHeight = baseRowHeight;
          const traitHeights: Record<string, number> = {};
          Object.keys(traits).forEach((key) => {
            if (i < traits[key].length) {
              traitHeights[key] = doc.heightOfString(`${28 - i} ${traits[key][i]}`, {
                width: colWidth - 10,
              });
              maxHeight = Math.max(maxHeight, traitHeights[key] + 4);
            }
          });

          if (i % 2 === 0) {
            doc.rect(tableX, rowY, tableWidth, maxHeight).fill(colors.nonprogress);
          }

          Object.entries(traits).forEach(([key, list], index) => {
            if (i < list.length) {
              const textY = rowY + (maxHeight - traitHeights[key]) / 2;
              const matched = boldIfMatched(list[i], key);
              doc.fillColor(matched ? discHeaders[index].color : colors.black);
              doc.font(matched ? 'fontBlack' : fontNormal);
              doc.text(`${28 - i} ${list[i]}`, tableX + colWidth * index + 5, textY + 2, {
                width: colWidth - 10,
              });
            }
          });

          rowY += maxHeight;
        }

        doc.fillColor(colors.black);
        doc.font(fontNormal);
        doc.y = rowY;
        break;
      }
      case 'disc-trait-icon': {
        // reports/disc.ts-ийн "Үе шат II" доторх `for (const v of k)` мөр
        // бүрийн [icon] **тод шинж нэр**: тайлбар зохион байгуулалттай ЯГ
        // адил — гэхдээ icon нь legacy-гийн ХАТУУ DISC өнгөний багц
        // (icons/disc_2_<color>) БИШ, Studio хэрэглэгчийн upload хийсэн
        // дурын зураг (block.imageUrl, renderGraphic-тэй адил axios fetch).
        //
        // {{result.selectedTraitsD}} гэх мэт token нь ХЭД ХЭДЭН тохирсон
        // шинжийг "\n\n"-ээр тусгаарлагдсан параграф болгож буцаадаг тул
        // ЭНД мөн тэдгээрийг параграф тус бүрээр нь ТУС БҮРД ТУСДАА icon-той
        // мөр болгож зурна — ганц icon-г зөвхөн эхний мөрөнд биш, шинж
        // бүрийн өмнө давтана (нэг зурагны буфер дахин ашиглана).
        const rowX = block.x ?? marginX;
        const iconSize = 16;
        const rowWidth = blockWidth || doc.page.width - rowX - marginX;
        const textX = rowX + iconSize + 6;
        const textWidth = Math.max(0, rowWidth - iconSize - 6);

        let iconBuffer: Buffer | null = null;
        if (block.imageUrl) {
          try {
            iconBuffer = await this.loadImageForBox(block.imageUrl, iconSize, iconSize);
          } catch (err) {
            console.warn(`[DynamicTemplateRenderer] disc-trait-icon imageUrl "${block.imageUrl}" fetch/draw failed — skipped`, err?.message || err);
          }
        }

        const text = this.resolveTokens(block.content, ctx);
        const paragraphs = text ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
        const baseColor = block.style?.color || colors.black;
        doc.fontSize(block.style?.fontSize || 12);

        paragraphs.forEach((paragraph, pIdx) => {
          const rowY = doc.y;
          if (iconBuffer) {
            doc.image(iconBuffer, rowX, rowY, { width: iconSize, height: iconSize });
          }
          const segments = parseRichTextSegments(paragraph);
          segments.forEach((seg, idx) => {
            this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal', seg.italic);
            // seg.accent > boldColor (эхний **тод шинж нэр**-ийг тусад нь
            // өнгөөр ялгах, RightPanel.tsx-ийн "Тод үгийн өнгө") > энгийн өнгө.
            doc.fillColor(
              seg.link && !seg.accent
                ? LINK_COLOR
                : seg.accent
                ? (seg.accentColor || colors.orange)
                : (seg.bold || seg.black) && block.style?.boldColor
                  ? block.style.boldColor
                  : baseColor,
            );
            const opts: any = { ...segLinkOpts(seg), continued: idx < segments.length - 1, width: textWidth, align: 'justify' };
            if (idx === 0) doc.text(seg.text, textX, rowY, opts);
            else doc.text(seg.text, opts);
          });
          doc.x = rowX;
          doc.y = Math.max(doc.y, rowY + iconSize) + (pIdx < paragraphs.length - 1 ? 8 : 6);
        });

        doc.fillColor(colors.black);
        doc.font(fontNormal);
        doc.x = rowX;
        break;
      }
      case 'disc-eval-table': {
        // reports/disc.ts-ийн "Үнэлгээний хүснэгт" — D/I/S/C/N 5 баганатай,
        // "Байнга"/"Бараг үгүй"/тод "Зөрүү" мөртэй хүснэгт. userAnswer +
        // questionAnswerCategory хүснэгтээс SQL query-ээр (+1/-1 оноо тус
        // бүрийг нэмж) тооцоологдоно — экспорт хийхэд exam.code шаардлагатай
        // (result биш, ТУХАЙН exam-ийн бодит хариултаас query хийдэг тул).
        const tableX = block.x ?? marginX;
        const tableWidth = blockWidth || doc.page.width - tableX - marginX;
        const examCode = (exam as any)?.code;

        const indexs: Record<string, { min: number; max: number }> = {
          d: { min: 0, max: 0 },
          i: { min: 0, max: 0 },
          s: { min: 0, max: 0 },
          c: { min: 0, max: 0 },
          n: { min: 0, max: 0 },
        };

        if (examCode) {
          try {
            const query = NAMED_SQL.DISC_ANSWER_POINTS; // src/report-data/named-sql.ts
            const sqlRows: any[] = await this.userAnswer.query(query, [examCode]);
            for (const r of sqlRows) {
              if (r.point == 0) continue;
              const key = (r.name || '').toLowerCase();
              if (!indexs[key]) continue;
              if (r.point == 1) indexs[key].max += +r.point;
              if (r.point == -1) indexs[key].min += +r.point;
            }
          } catch (err) {
            console.warn('[DynamicTemplateRenderer] disc-eval-table SQL query failed', err?.message || err);
          }
        }

        const a = tableWidth / 18;
        const lineHeight = 18;
        doc.font(fontNormal).fontSize(12).fillColor(colors.black);
        const y = doc.y;
        const titleWidth = doc.widthOfString('Үнэлгээний хүснэгт');

        doc.moveTo(tableX, y + lineHeight).strokeColor(colors.black).lineTo(tableX + tableWidth, y + lineHeight).stroke();
        doc.moveTo(8 * a + tableX, y).strokeColor(colors.black).lineTo(tableX + tableWidth, y).stroke();
        doc.moveTo(tableX, y + 4 * lineHeight).strokeColor(colors.black).lineTo(tableX + tableWidth, y + 4 * lineHeight).stroke();
        doc.moveTo(5 * a + tableX, y + 2 * lineHeight).strokeColor(colors.black).lineTo(tableX + tableWidth, y + 2 * lineHeight).stroke();
        doc.moveTo(5 * a + tableX, y + 3 * lineHeight).strokeColor(colors.black).lineTo(tableX + tableWidth, y + 3 * lineHeight).stroke();
        doc.moveTo(tableX, y + lineHeight).strokeColor(colors.black).lineTo(tableX, y + 4 * lineHeight).stroke();
        doc.moveTo(5 * a + tableX, y + lineHeight).strokeColor(colors.black).lineTo(5 * a + tableX, y + 4 * lineHeight).stroke();
        doc.moveTo(8 * a + tableX, y).strokeColor(colors.black).lineTo(8 * a + tableX, y + 4 * lineHeight).stroke();
        doc.moveTo(8 * a + tableX, y + lineHeight).strokeColor(colors.black).lineTo(tableX + tableWidth, y + lineHeight).stroke();

        doc.text('Үнэлгээний хүснэгт', a * 2.5 - titleWidth / 2 + tableX, y + lineHeight * 2 + 3);

        const text1 = 'Байнга';
        const text1Width = doc.widthOfString(text1);
        doc.text(text1, a * 6.5 - text1Width / 2 + tableX, y + lineHeight + 3);
        const text2 = 'Бараг үгүй';
        const text2Width = doc.widthOfString(text2);
        doc.text(text2, a * 6.5 - text2Width / 2 + tableX, y + lineHeight * 2 + 3).font(fontBold);
        const text3 = 'Зөрүү';
        const text3Width = doc.widthOfString(text3);
        doc.text(text3, a * 6.5 - text3Width / 2 + tableX, y + lineHeight * 3 + 3);

        Object.entries(indexs).forEach(([key, value], i) => {
          const headerWidth = doc.widthOfString(key.toUpperCase());
          doc.font(fontNormal).text(key.toUpperCase(), a * 9 + i * 2 * a - headerWidth / 2 + tableX, y + 3);
          const max = `${value.max}`;
          const maxWidth = doc.widthOfString(max);
          doc.text(max, a * 9 + i * 2 * a - maxWidth / 2 + tableX, y + lineHeight + 3);
          const min = `${Math.abs(value.min)}`;
          const minWidth = doc.widthOfString(min);
          doc.text(min, a * 9 + i * 2 * a - minWidth / 2 + tableX, y + 2 * lineHeight + 3);
          doc
            .moveTo(10 * a + tableX + i * 2 * a + 1, y)
            .strokeColor(colors.black)
            .lineTo(10 * a + tableX + i * 2 * a + 1, y + 4 * lineHeight)
            .stroke();
          const diff = `${value.max + value.min}`;
          const diffWidth = doc.widthOfString(diff);
          if (key.toLowerCase() != 'n') {
            doc.font(fontBold).text(diff, a * 9 + i * 2 * a - diffWidth / 2 + tableX, y + 3 * lineHeight + 3);
          }
        });

        doc.font(fontNormal).fillColor(colors.black);
        doc.x = tableX;
        doc.y = y + 4 * lineHeight + 10;
        break;
      }
      case 'score-interpretation-table': {
        // Legacy drawScoreTable()-той ЯГ адил зурна — "Хариултын ангилал"/
        // "Харьцуулсан эрэмбэ буюу перцентиль" 2 багана хоёр мөрийг хамарсан
        // (rowspan), "Оноо" гарчиг 3 баганыг (Нийт/Өөрийн чадамж/Өөртөө
        // таалагдах байдал) хамарсан (colspan), дараа нь Studio-д
        // засварласан block.tableRows-ын мөр бүр. Толгойн нэрс тогтмол.
        const tableX = block.x ?? marginX;
        const tableWidth = blockWidth || doc.page.width - tableX - marginX;
        const colWidths = [
          tableWidth * 0.2,
          tableWidth * 0.25,
          tableWidth * 0.15,
          tableWidth * 0.15,
          tableWidth * 0.25,
        ];
        const headerRowHeights = [18, 36];
        const bodyRowHeight = 18;
        const rows: string[][] = ((block.tableRows as any[]) || []).map((r) => [
          r?.category ?? '',
          r?.percentile ?? '',
          r?.total ?? '',
          r?.selfCompetence ?? '',
          r?.selfLiking ?? '',
        ]);

        let currentY = doc.y;
        let x = tableX;

        doc.rect(x, currentY, colWidths[0], headerRowHeights[0] + headerRowHeights[1]).stroke();
        doc.font(fontBold).fontSize(12);

        let text = 'Хариултын\nангилал';
        let textHeight = doc.heightOfString(text, { width: colWidths[0] - 10, align: 'center' });
        doc.text(text, x + 5, currentY + (headerRowHeights[0] + headerRowHeights[1] - textHeight) / 2 + 1, {
          width: colWidths[0] - 10,
          align: 'center',
        });

        x += colWidths[0];

        doc.rect(x, currentY, colWidths[1], headerRowHeights[0] + headerRowHeights[1]).stroke();
        text = 'Харьцуулсан эрэмбэ\nбуюу перцентиль*';
        textHeight = doc.heightOfString(text, { width: colWidths[1] - 10, align: 'center' });
        doc.text(text, x + 5, currentY + (headerRowHeights[0] + headerRowHeights[1] - textHeight) / 2 + 1, {
          width: colWidths[1] - 10,
          align: 'center',
        });

        x += colWidths[1];

        doc.rect(x, currentY, colWidths[2] + colWidths[3] + colWidths[4], headerRowHeights[0]).stroke();
        text = 'Оноо';
        textHeight = doc.heightOfString(text, {
          width: colWidths[2] + colWidths[3] + colWidths[4] - 10,
          align: 'center',
        });
        doc.text(text, x + 5, currentY + (headerRowHeights[0] - textHeight) / 2 + 1, {
          width: colWidths[2] + colWidths[3] + colWidths[4] - 10,
          align: 'center',
        });

        currentY += headerRowHeights[0];
        x = tableX + colWidths[0] + colWidths[1];

        const subHeaders = ['Нийт', 'Өөрийн чадамж', 'Өөртөө таалагдах байдал'];
        for (let i = 0; i < 3; i++) {
          doc.rect(x, currentY, colWidths[i + 2], headerRowHeights[1]).stroke();
          textHeight = doc.heightOfString(subHeaders[i], { width: colWidths[i + 2] - 10, align: 'center' });
          doc.text(subHeaders[i], x + 5, currentY + (headerRowHeights[1] - textHeight) / 2 + 1, {
            width: colWidths[i + 2] - 10,
            align: 'center',
          });
          x += colWidths[i + 2];
        }

        currentY += headerRowHeights[1];
        doc.font(fontNormal).fontSize(12);

        for (const row of rows) {
          x = tableX;
          for (let c = 0; c < row.length; c++) {
            doc.rect(x, currentY, colWidths[c], bodyRowHeight).stroke();
            textHeight = doc.heightOfString(row[c], { width: colWidths[c] - 10, align: 'center' });
            doc.text(row[c], x + 5, currentY + (bodyRowHeight - textHeight) / 2 + 1, {
              width: colWidths[c] - 10,
              align: 'center',
            });
            x += colWidths[c];
          }
          currentY += bodyRowHeight;
        }

        doc.font(fontNormal).fillColor(colors.black);
        doc.x = tableX;
        doc.y = currentY + 12;
        break;
      }
      case 'score-bar': {
        // "Нийт оноо {point}/{total}" тод бичиг мөр + доор нь бүтэн
        // өргөнтэй, улбар шараас улаан руу шилждэг gradient дугуй буланд
        // progress bar. Legacy-д яг адил hardcoded функц олдоогүй тул
        // score-default-той адил result.point/result.total ашигласан шинэ
        // дизайн (Studio-гоос screenshot-оор өгсөн).
        const barX = block.x ?? marginX;
        const barWidth = blockWidth || doc.page.width - barX - marginX;
        const point = result?.point ?? 0;
        const total = result?.total ?? 0;

        // hideScoreText=true — "Нийт оноо X/Y" мөрийг алгасаж зөвхөн bar зурна.
        if (!block.hideScoreText) {
          this.safeFont(doc, block.style?.fontFamily, true);
          doc.fontSize(12).fillColor(colors.black);
          doc.text('Нийт оноо ', barX, doc.y, { continued: true });
          doc.fillColor(colors.orange).fontSize(15).text(`${point}`, { continued: true });
          doc.fillColor(colors.black).text(`/${total}`);
        }

        const barY = block.hideScoreText ? doc.y : doc.y + 6;
        const barHeight = 8;
        doc.roundedRect(barX, barY, barWidth, barHeight, barHeight / 2).fill(colors.nonprogress);

        const ratio = total > 0 ? Math.min(1, Math.max(0, point / total)) : 0;
        const fillWidth = barWidth * ratio;
        if (fillWidth > 0) {
          const grad = doc.linearGradient(barX, barY, barX + fillWidth, barY);
          grad.stop(0, colors.orange).stop(1, colors.red);
          doc.roundedRect(barX, barY, fillWidth, barHeight, barHeight / 2).fill(grad);
        }

        doc.fillColor(colors.black);
        doc.font(fontNormal);
        doc.x = barX;
        doc.y = barY + barHeight + 10;
        break;
      }
      case 'score-level': {
        // reports/rses.ts-ийн "Өөртөө таалагдах байдал"/"Өөрийн чадамж"
        // хуудсуудтай ЯГ адил логик — result.details-ээс (block.lookupCategory-
        // тай тохирох d.value) олдсон мөрийн ТҮҮХИЙ оноог (d.cause) block.
        // levelBands-ийн ӨСӨХ дараалалтай босготой жишиж (харьцуулж) тохирох
        // "level" нэрийг (Маш бага/Бага/Дундаж/Их/Маш их гэх мэт) тодорхойлно
        // — СҮҮЛИЙН мөрийн босгыг үл тооно (бусад бүгдээс дээш бол сүүлийнх).
        const levelX = block.x ?? marginX;
        const details: any[] = (result as any)?.details || [];
        const matched = details.find((d) => d.value === block.lookupCategory);
        const scoreMax = block.scoreMax ?? 15;
        const bands: any[] = block.levelBands || [];
        const rawScore = matched ? Number(matched.cause) : NaN;
        const hasScore = !isNaN(rawScore);

        let levelLabel = '';
        if (hasScore && bands.length) {
          for (let i = 0; i < bands.length; i++) {
            if (i === bands.length - 1) {
              levelLabel = bands[i].label;
              break;
            }
            const t = Number(bands[i].maxThreshold);
            if (!isNaN(t) && rawScore <= t) {
              levelLabel = bands[i].label;
              break;
            }
          }
        }

        // block.content нь ЗАСВАРЛАГДАХ rich-text загвар (RightPanel.tsx-ийн
        // "score-level" editor-оос) — {{level.*}} нь ЛОКАЛ placeholder tokens
        // (глобал resolveTokens()-д ОРОЛЦДОГГҮЙ, зөвхөн энэ блокийн жинхэнэ
        // утгаар шууд .replace()-лэгдэнэ), дараа нь **тод**/~~хар~~/==онцолсон==
        // тэмдэглэгээг parseRichTextSegments-ээр ердийн 'text' блоктой адил
        // зурна (мөр (\n) бүрийг тусад нь).
        const template = (block.content as string) || DEFAULT_SCORE_LEVEL_CONTENT;
        const scoreStr = hasScore ? `${rawScore}` : '—';
        const labelStr = hasScore ? (levelLabel || '—').toUpperCase() : '—';
        const resolved = template
          .split('{{level.category}}').join(block.lookupCategory || '')
          .split('{{level.score}}').join(scoreStr)
          .split('{{level.max}}').join(`${scoreMax}`)
          .split('{{level.label}}').join(labelStr);

        const baseColor = block.style?.color || colors.black;
        const segColor = (seg: { accent: boolean; accentColor?: string; bold: boolean; black: boolean; link?: string }) =>
          seg.link && !seg.accent
            ? LINK_COLOR
            : seg.accent
            ? (seg.accentColor || colors.orange)
            : (seg.bold || seg.black) && block.style?.boldColor
              ? block.style.boldColor
              : baseColor;

        doc.fontSize(block.style?.fontSize || 12);
        this.safeFont(doc, block.style?.fontFamily, false);
        doc.x = levelX;
        const levelWidth = blockWidth || doc.page.width - levelX - marginX;
        const lines = resolved.split('\n').filter((l) => l.length > 0);
        lines.forEach((line) => {
          const rowY = doc.y;
          const segs = parseRichTextSegments(line);
          segs.forEach((seg, idx) => {
            this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal', seg.italic);
            doc.fillColor(segColor(seg));
            const opts: any = { ...segLinkOpts(seg), continued: idx < segs.length - 1, width: levelWidth, align: 'left' };
            if (idx === 0) doc.text(seg.text, levelX, rowY, opts);
            else doc.text(seg.text, opts);
          });
        });

        doc.font(fontNormal).fillColor(colors.black);
        doc.x = levelX;
        doc.y = doc.y + 10;

        // "Нийт оноо X/max" — score-bar блоктой ЯГ АДИЛ градиент прогресс
        // bar, гэхдээ result.point/result.total-ийн оронд ЭНЭ АНГИЛЛЫН
        // (rawScore/scoreMax) харьцаагаар — score-level блок дотор ҮРГЭЛЖ
        // автоматаар зурагдана (тусад нь score-bar блок нэмэх шаардлагагүй).
        if (!block.hideScoreText) {
          this.safeFont(doc, block.style?.fontFamily, true);
          doc.fontSize(12).fillColor(colors.black);
          doc.text('Нийт оноо ', levelX, doc.y, { continued: true });
          doc.fillColor(colors.orange).fontSize(15).text(hasScore ? `${rawScore}` : '—', { continued: true });
          doc.fillColor(colors.black).text(`/${scoreMax}`);
        }

        const barY = block.hideScoreText ? doc.y + 4 : doc.y + 6;
        const barHeight = 8;
        doc.roundedRect(levelX, barY, levelWidth, barHeight, barHeight / 2).fill(colors.nonprogress);
        const barRatio = hasScore && scoreMax > 0 ? Math.min(1, Math.max(0, rawScore / scoreMax)) : 0;
        const barFillWidth = levelWidth * barRatio;
        if (barFillWidth > 0) {
          const grad = doc.linearGradient(levelX, barY, levelX + barFillWidth, barY);
          grad.stop(0, colors.orange).stop(1, colors.red);
          doc.roundedRect(levelX, barY, barFillWidth, barHeight, barHeight / 2).fill(grad);
        }
        doc.fillColor(colors.black).font(fontNormal);
        doc.x = levelX;
        doc.y = barY + barHeight + 10;

        // "Давхар" квартил график — reports/rses.ts-ийн examQuartileGraph3()-
        // той ЯГ АДИЛ (тав тэмдэгтэй pin + "Таны оноо нь нийт тест
        // гүйцэтгэгчдийн X%-г давсан" бичvэг), тухайн block.quartileTest-ээр
        // заасан тестийн CSV (norm-referenced) дата дээр суурилна —
        // RightPanel.tsx-ийн "Квартил график давхар нэмэх" сонголтоор
        // идэвхжинэ. Оноо олдоогүй (hasScore=false) үед CSV lookup хийх
        // утгагүй тул алгасна.
        if (block.showQuartileGraph && hasScore) {
          await this.single.examQuartileGraph3(
            doc,
            rawScore,
            block.lookupCategory || '',
            block.quartileTest || 'rses',
          );
        }
        break;
      }
      // 'cover' handled at page level before this loop runs.
      default:
        console.warn(`[DynamicTemplateRenderer] unhandled block type "${block.type}" — skipped`);
    }
  }

  // ── "table" блок (Studio-д гараар үүсгэсэн хүснэгт) ─────────────────────
  // Studio-ийн Canvas (TableBlock.tsx)-тай ижил: баганын өргөн = жин/нийлбэр ×
  // block.width, мөрийн өндөр = max(тохируулсан min, нүдний текстийн өндөр),
  // нэгтгэсэн (rowSpan) нүдэнд зай хүрэлцэхгүй бол сүүлийн мөрийг сунгана.
  private renderTable(doc: PDFKit.PDFDocument, block: any, ctx: RenderCtx) {
    const t: TableConfig | undefined = block.table;
    if (!t || !Array.isArray(t.rows) || !t.rows.length || !t.colWidths?.length) return;
    const x0 = typeof block.x === 'number' ? block.x : marginX;
    const y0 = typeof block.y === 'number' ? block.y : doc.y;
    const W = typeof block.width === 'number' ? block.width : doc.page.width - x0 - marginX;
    const R = t.rows.length;
    const sum = t.colWidths.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    const colW = t.colWidths.map((w) => ((Number(w) || 0) / sum) * W);
    const colX: number[] = [];
    colW.reduce((acc, w, i) => ((colX[i] = acc), acc + w), x0);
    const pad = Number(t.padding ?? 4);
    const baseSize = Number(t.fontSize || 10);
    const baseColor = block.style?.color || colors.black;
    const fontFamily = block.style?.fontFamily;
    const anchors = listAnchors(t);

    const weightOf = (cellWeight: string, seg: { bold: boolean; black: boolean }) =>
      seg.black || cellWeight === 'black' ? 'black' : seg.bold || cellWeight === 'bold' ? 'bold' : 'normal';

    // 1) Нүд бүрийн текст ба хэрэгцээт өндөр — Studio TableBlock.tsx-тэй
    // адил: line-height 1.2, pre-wrap + break-word (rich-layout.ts).
    const prepared = anchors.map((a) => {
      const text = this.resolveTokens(a.cell.text || '', ctx);
      const segments = parseRichTextSegments(text);
      const fontSize = Number(a.cell.fontSize || baseSize);
      const width = Math.max(1, colW.slice(a.c, a.c + a.cs).reduce((p, q) => p + q, 0) - pad * 2);
      const cellWeight = a.cell.weight || 'normal';
      const layout = layoutRichText(doc, segments, {
        width,
        fontSize,
        lineHeight: 1.2,
        align: (a.cell.align as any) || 'left',
        breakLongWords: true,
        setFont: (seg: RichSeg) => this.safeFontWeight(doc, fontFamily, weightOf(cellWeight, seg as any) as any, !!seg.italic),
      });
      const textH = segments.length ? layout.height : 0;
      return { ...a, text, segments, fontSize, width, layout, need: textH + pad * 2 };
    });

    const rowH = Array.from({ length: R }, (_, r) => Math.max(8, Number(t.rowHeights?.[r]) || 22));
    prepared.filter((p) => p.rs === 1).forEach((p) => (rowH[p.r] = Math.max(rowH[p.r], p.need)));
    prepared
      .filter((p) => p.rs > 1)
      .forEach((p) => {
        const have = rowH.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0);
        if (p.need > have) rowH[p.r + p.rs - 1] += p.need - have;
      });
    const rowY: number[] = [];
    rowH.reduce((acc, h, i) => ((rowY[i] = acc), acc + h), y0);
    const totalH = rowH.reduce((a, b) => a + b, 0);

    // 2) Дэвсгэр
    prepared.forEach((p) => {
      const v = cellVisual(t, p.cell, p.r, baseColor);
      if (!v.bg || v.bg === 'transparent') return;
      const w = colW.slice(p.c, p.c + p.cs).reduce((a, b) => a + b, 0);
      const h = rowH.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0);
      doc.save().rect(colX[p.c], rowY[p.r], w, h).fill(v.bg).restore();
    });

    // 3) Текст
    prepared.forEach((p) => {
      if (!p.segments.length) return;
      const v = cellVisual(t, p.cell, p.r, baseColor);
      const cellH = rowH.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0);
      const innerH = p.need - pad * 2;
      const valign = p.cell.valign || 'middle';
      const ty =
        valign === 'top'
          ? rowY[p.r] + pad
          : valign === 'bottom'
            ? rowY[p.r] + cellH - pad - innerH
            : rowY[p.r] + (cellH - innerH) / 2;
      const tx = colX[p.c] + pad;
      drawRichText(doc, p.layout, tx, ty, {
        colorOf: (seg: RichSeg) =>
          seg.link && !seg.accent ? LINK_COLOR : seg.accent ? seg.accentColor || colors.orange : v.color,
        ascent: GILROY_ASCENT,
        descent: GILROY_DESCENT,
      });
    });

    // 4) Хүрээ
    const bw = Number(t.borderWidth ?? 0.75);
    if (bw > 0) {
      doc.save().lineWidth(bw).strokeColor(t.borderColor || '#D1D5DB');
      // Тал тус бүрээр (table-block.ts cellEdges — Studio TableBlock.tsx-тэй ижил дүрэм).
      const amap = buildAnchorMap(t);
      prepared.forEach((p) => {
        const w = colW.slice(p.c, p.c + p.cs).reduce((a, b) => a + b, 0);
        const h = rowH.slice(p.r, p.r + p.rs).reduce((a, b) => a + b, 0);
        const x1 = colX[p.c], y1 = rowY[p.r], x2 = x1 + w, y2 = y1 + h;
        const e = cellEdges(t, amap, p.r, p.c, p.rs, p.cs);
        if (e.top) doc.moveTo(x1, y1).lineTo(x2, y1).stroke();
        if (e.right) doc.moveTo(x2, y1).lineTo(x2, y2).stroke();
        if (e.bottom) doc.moveTo(x1, y2).lineTo(x2, y2).stroke();
        if (e.left) doc.moveTo(x1, y1).lineTo(x1, y2).stroke();
      });
      doc.restore();
    }

    doc.fillColor(colors.black);
    doc.font(fontNormal);
    doc.x = x0;
    doc.y = y0 + totalH;
  }

  // Studio-д upload хийсэн зураг (pt_<ts>_<name>). Хадгалсан URL-ийн хост нь Studio-г
  // ашигласан ОРЧНЫХ (жиш: test-ийн docker нэр "hire-core-1", "localhost:5050") —
  // тестийг өөр орчин руу (test → prod) зөөхөд энд resolve болохгүй (EAI_AGAIN).
  // Тиймээс key-г салгаж ЭНЭ орчноос уншина:
  //   1) core-той хуваалцдаг uploads хавтас (prod-д /app/uploads нэг volume),
  //   2) энэ report-ийн өөрийн core (CORE_API_URL, эсвэл CORE + "api/v1/"),
  //   3) эцэст нь хадгалсан URL-аар.
  /**
   * Studio зураг: эх буферыг URL-аар кэшлээд (core HTTP / диск дахин уншихгүй), блокийн хайрцагт
   * (pt) хангалттай хэмжээ хүртэл жижигрүүлнэ — src/pdf/image-fit.ts.
   */
  private async loadImageForBox(url: string, wPt: number, hPt: number): Promise<Buffer> {
    const src = await cachedSource(url, () => this.loadUploadedImage(url));
    return fitForBox(url, src, wPt, hPt);
  }

  private async loadUploadedImage(url: string): Promise<Buffer> {
    // Studio-ийн үндсэн icon ("/icons/<зам>") — studio/public/icons ба src/assets/icons ижил багц.
    const iconM = url.match(/^\/icons\/(.+)$/);
    if (iconM) {
      const rel = decodeURIComponent(iconM[1]);
      if (rel.includes('..')) throw new Error('bad icon path');
      for (const base of ['src/assets/icons', 'dist/assets/icons', 'assets/icons']) {
        const file = path.resolve(process.cwd(), base, rel);
        if (fs.existsSync(file)) return fs.readFileSync(file);
      }
      throw new Error(`icon not found: ${rel}`);
    }
    const m = url.match(/pdf-template\/image\/([^/?#]+)/);
    let key: string | null = null;
    if (m) {
      try {
        key = decodeURIComponent(m[1]);
      } catch {
        key = m[1];
      }
    }
    if (key && (key.includes('..') || key.includes('/'))) key = null;
    if (key) {
      for (const dir of [process.env.UPLOADS_DIR, 'uploads', '../core/uploads'].filter(Boolean) as string[]) {
        const file = path.resolve(process.cwd(), dir, key);
        if (fs.existsSync(file)) return fs.readFileSync(file);
      }
    }
    const base = coreApiBase();
    const ownUrl = key && base ? `${base}pdf-template/image/${encodeURIComponent(key)}` : null;
    if (ownUrl) {
      try {
        const res = await axios.get(ownUrl, { responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(res.data);
      } catch (err) {
        if (ownUrl === url) throw err;
        // хадгалсан URL-аар дахин оролдоно (доор)
      }
    }
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return Buffer.from(res.data);
  }

  private async renderGraphic(
    doc: PDFKit.PDFDocument,
    block: any,
    ctx: RenderCtx,
    assetService: AssetsService,
  ) {
    const { result, exam } = ctx;
    const width = Math.min(block.width || 200, doc.page.width - marginX * 2);
    const x = doc.x;
    const y = doc.y;

    // Хэрэглэгчийн өөрөө upload хийсэн зураг ("Зураг блок") — graphicId-аас
    // ямагт түрүүлж шалгана, учир нь upload хийхэд Studio талд graphicId-г
    // хоослож imageUrl-ыг сэтгэдэг (RightPanel.tsx-ийн handleImageUpload).
    if ((block.type === 'image' || block.type === 'icon') && block.imageUrl) {
      try {
        // Studio Canvas-тай адил — зургийг блокийн хайрцагт төвлөрүүлж багтаана. Дэвсгэр
        // (дугуй / бөөрөнхий дөрвөлжин), дотор зай, тунгалаг — imageStyle.
        const h = block.height || width;
        const st = block.imageStyle || {};
        const bgOn = st.bg === 'circle' || st.bg === 'rounded';
        const op = Number.isFinite(Number(st.opacity)) ? Math.min(1, Math.max(0, Number(st.opacity))) : 1;
        const pad = bgOn ? (Number.isFinite(Number(st.padding)) ? Math.max(0, Number(st.padding)) : 6) : 0;
        const buffer = await this.loadImageForBox(
          block.imageUrl,
          Math.max(1, width - pad * 2),
          Math.max(1, h - pad * 2),
        );
        doc.save();
        if (op < 1) doc.opacity(op);
        if (bgOn) {
          const bg = String(st.bgColor || '#FFF5F2');
          if (st.bg === 'circle') doc.ellipse(x + width / 2, y + h / 2, width / 2, h / 2).fill(bg);
          else doc.roundedRect(x, y, width, h, Math.min(8, width / 2, h / 2)).fill(bg);
        }
        try {
          doc.image(buffer, x + pad, y + pad, {
            fit: [Math.max(1, width - pad * 2), Math.max(1, h - pad * 2)],
            align: 'center',
            valign: 'center',
          });
        } finally {
          doc.restore();
        }
      } catch (err) {
        console.warn(`[DynamicTemplateRenderer] imageUrl "${block.imageUrl}" fetch/draw failed — skipped`, err?.message || err);
      }
      return;
    }

    switch (block.graphicId) {
      case 'qr_code': {
        const buffer = generateQRCodeSync(`https://hire.mn/result/${exam?.code ?? ''}`);
        doc.image(buffer, x, y, { width: Math.min(width, 120) });
        break;
      }
      case 'quartile_art': {
        // "Квартил зураг" — 'quartile' блоктой ижил bell-curve график.
        await this.single.examQuartile(doc, result, undefined, false);
        break;
      }
      case 'cover_logo': {
        doc.image(assetService.getAsset('logo'), x, y, { width: Math.min(width, 100) });
        break;
      }
      case 'gauge_chart': {
        const buffer = await this.vis.doughnut(colors.nonprogress, result.total, result.point);
        doc.image(buffer, x, y, { width });
        break;
      }
      case 'radar_chart': {
        const rows = await this.getCategories(result);
        if (!rows.length) {
          console.warn('[DynamicTemplateRenderer] radar_chart: no category data — skipped');
          break;
        }
        const indicator = rows.map((r) => ({ name: r.categoryName, max: r.totalPoint || 1 }));
        const data = rows.map((r) => r.point);
        const buffer = await this.vis.createRadar(indicator, data);
        doc.image(buffer, x, y, { width, height: (width / 850) * 620 });
        break;
      }
      case 'bar_chart': {
        const rows = await this.getCategories(result);
        if (!rows.length) {
          console.warn('[DynamicTemplateRenderer] bar_chart: no category data — skipped');
          break;
        }
        const buffer = await this.vis.createNegativeBarChart(
          rows.map((r) => r.categoryName),
          rows.map((r) => r.point),
        );
        doc.image(buffer, x, y, { width });
        break;
      }
      default:
        console.warn(
          `[DynamicTemplateRenderer] graphic "${block.graphicId || block.type}" not implemented — skipped`,
        );
    }
  }

  // ── Шинэ график блокууд (report-widgets.ts) ──────────────────────────────
  // Studio Canvas.tsx-ийн WheelRadar/LevelCards/ProgressBar-тай ЯГ АДИЛ геометр.

  private richSetFont(doc: PDFKit.PDFDocument, family: string | undefined, forceBold = false) {
    return (seg: RichSeg) =>
      this.safeFontWeight(
        doc,
        family,
        seg.black ? 'black' : seg.bold || forceBold ? 'bold' : 'normal',
        !!seg.italic,
      );
  }

  // Тестийн хариултын ангиллууд (id дарааллаар = admin-д оруулсан дараалал) + тухайн шалгалтын
  // оноо. Demo preview-д бодит хариулт байхгүй тул нэрээс тогтмол жишээ утга.
  private async loadAnswerCategories(assessmentId: number | undefined): Promise<AnswerCategoryTotal[]> {
    this.currentAnswerMaxRows = null;
    this.groupMaxCache.clear();
    if (!assessmentId) return [];
    let cats: { id: number; name: string }[] = [];
    // Дээд оноо — асуултын бүтцээс (хариултаас үл хамаарна, demo preview-д ч бодит).
    const maxesP = this.userAnswer
      .query(NAMED_SQL.ANSWER_CATEGORY_MAX_ROWS, [assessmentId])
      .then((rows: any[]) => {
        this.currentAnswerMaxRows = rows || [];
        return answerCategoryMaxes(rows || []);
      })
      .catch((e) => {
        console.warn('[DynamicTemplateRenderer] дэд бүлгийн дээд оноо бодоход алдаа', e);
        return undefined;
      });
    try {
      const rows: any[] = await this.userAnswer.query(
        NAMED_SQL.ANSWER_CATEGORY_LIST,
        [assessmentId],
      );
      cats = (rows || []).map((r) => ({ id: Number(r.id), name: String(r.name ?? '') }));
    } catch (e) {
      console.warn('[DynamicTemplateRenderer] questionAnswerCategory ачаалахад алдаа', e);
      await maxesP;
      return [];
    }
    const maxes = await maxesP;
    if (this.demoMode) {
      return cats.map((c) => ({
        id: c.id,
        name: c.name,
        point: answerDemoValue(c.name, 'нийт'),
        count: 1,
        ...(maxes ? { max: maxes.get(c.id) ?? 0 } : {}),
      }));
    }
    return answerCategoryTotals(cats, this.currentAnswerStats, maxes);
  }

  // {{category[g].answerCategory[i].<талбар>}} — i-р дэд бүлгийн (хариултын ангилал) оноо / дээд
  // оноог ЗӨВХӨН g-р бүлгийн (блокийн) асуултаар. Дугаарууд {{category[g]}} / {{answerCategory[i]}}-тэй
  // ИЖИЛ. Demo: оноо нь answerCategory[i]-ийн жишээ утга; бүлгийн нэр бодит блоктой таарвал дээд
  // оноо тухайн блокийнх, үгүй бол answerCategory[i]-ийнх.
  private groupAnswerCategoryValue(gi: number, ai: number, field: string): string {
    const g = this.currentCategoryStats[gi - 1];
    const a = this.currentAnswerCategories[ai - 1];
    if (!g || !a) return '';
    const group: GroupRef = { id: g.id ?? null, name: g.categoryName };
    const maxes = this.groupAnswerMaxes(group);
    let t: AnswerCategoryTotal;
    if (this.demoMode) {
      const m = maxes?.get(a.id);
      t = m ? { ...a, max: m } : a;
    } else {
      t = groupAnswerCategoryTotal(a, group, this.currentAnswerStats, maxes);
    }
    switch (field) {
      case 'name':
        return t.name ?? '';
      case 'score':
        return formatAnswerNumber(t.point);
      case 'max':
        return t.max ? formatAnswerNumber(t.max) : '';
      case 'percent':
        return t.max ? String(Math.round((t.point / t.max) * 100)) : '';
      case 'avg':
        return formatAnswerNumber(categoryAvg(t));
      default:
        return String(t.count ?? '');
    }
  }

  private groupAnswerMaxes(group: GroupRef): Map<number, number> | undefined {
    const rows = this.currentAnswerMaxRows;
    if (!rows) return undefined;
    const key = `${group.id ?? ''}|${group.name ?? ''}`;
    let m = this.groupMaxCache.get(key);
    if (!m) {
      m = answerCategoryMaxes(rows.filter((r) => inGroupRef(group, r.questionCategoryId, r.questionCategoryName)));
      this.groupMaxCache.set(key, m);
    }
    return m;
  }

  // {{Гүйцэтгэлийн түвшин[Багын оролцоо]}} — [ ] доторх нь дэд бүлэг биш, БҮЛЭГ (асуултын
  // ангилал / блок) бол: тэр блок доторх хувьсагчийн дэд бүлгийн (source.category,
  // жиш "Гүйцэтгэл") оноо. 9 блок (хэмжээс) × 2 хариултын ангилал (Гүйцэтгэл / Ач холбогдол).
  private blockAnswerCategoryRow(
    block: string,
    sub: string | undefined,
  ): { name: string; point: number; count: number } | null {
    const norm = (x: string | null | undefined) => (x || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const b = norm(block);
    if (!b || !sub) return null;
    const isBlock =
      this.currentCategoryStats.some((c) => norm(c.categoryName) === b) ||
      this.currentAnswerStats.some((r) => norm(r.categoryName) === b);
    if (!isBlock) return null;
    const hit = answerRowsByName(this.currentAnswerStats, sub, block);
    return {
      name: sub,
      point: hit.reduce((a, r) => a + (Number(r.point) || 0), 0),
      count: hit.reduce((a, r) => a + (Number(r.count) || 0), 0),
    };
  }

  private async answerStats() {
    if (!this.answerStatsCache) {
      const code = this.currentResultCode;
      this.answerStatsCache = code
        ? this.userAnswer.answerCategoryStats(code).catch((e) => {
            console.warn('[DynamicTemplateRenderer] answerCategoryStats алдаа', e);
            return [];
          })
        : Promise.resolve([]);
    }
    return this.answerStatsCache;
  }

  private async renderWheel(doc: PDFKit.PDFDocument, block: any, ctx: RenderCtx) {
    const cfg = normalizeWheel(block.wheel);
    const x0 = typeof block.x === 'number' ? block.x : marginX;
    const y0 = typeof block.y === 'number' ? block.y : doc.y;
    const width = Number(block.width) > 0 ? Number(block.width) : doc.page.width - x0 - marginX;
    const L = wheelLayout(width, cfg);
    const cx = x0 + L.cx;
    const cy = y0 + L.cy;
    const n = cfg.axes.length;
    const levelsN = Math.max(1, cfg.levels.length);
    const rad = (d: number) => (d * Math.PI) / 180;
    const pt = (r: number, deg: number) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
    const f2 = (v: number) => Math.round(v * 100) / 100;

    // 1) Тайлбар (Х – Хангалтгүй …)
    if (L.legendH) {
      const colW = width / cfg.legendColumns;
      cfg.levels.forEach((lv, i) => {
        const x = x0 + (i % cfg.legendColumns) * colW;
        const y = y0 + Math.floor(i / cfg.legendColumns) * WHEEL_LEGEND_ROW_H;
        this.safeFontWeight(doc, undefined, 'bold');
        doc.fontSize(WHEEL_LEGEND_FS).fillColor(cfg.legendCodeColor);
        doc.text(lv.code, x, y, { lineBreak: false });
        const w = doc.widthOfString(lv.code);
        this.safeFontWeight(doc, undefined, 'normal');
        doc.fillColor(cfg.legendTextColor).text(` – ${lv.label}`, x + w, y, { lineBreak: false });
      });
    }

    // 2) Гадна өнгөт цагираг (тэнхлэг бүрт нэг сегмент)
    if (n > 0) {
      const half = 180 / n;
      const gap = Math.min(1.2, half * 0.2);
      cfg.axes.forEach((axis, i) => {
        const a = wheelAxisAngle(i, n);
        const a0 = a - half + gap / 2;
        const a1 = a + half - gap / 2;
        const large = a1 - a0 > 180 ? 1 : 0;
        const [ox0, oy0] = pt(L.outerR, a0);
        const [ox1, oy1] = pt(L.outerR, a1);
        const [ix1, iy1] = pt(L.ringInner, a1);
        const [ix0, iy0] = pt(L.ringInner, a0);
        doc
          .path(
            `M ${f2(ox0)} ${f2(oy0)} A ${f2(L.outerR)} ${f2(L.outerR)} 0 ${large} 1 ${f2(ox1)} ${f2(oy1)} ` +
              `L ${f2(ix1)} ${f2(iy1)} A ${f2(L.ringInner)} ${f2(L.ringInner)} 0 ${large} 0 ${f2(ix0)} ${f2(iy0)} Z`,
          )
          .fill(axis.color || '#999999');
      });
    } else {
      doc.circle(cx, cy, L.outerR).fill('#E5E7EB');
      doc.circle(cx, cy, L.ringInner).fill('#FFFFFF');
    }

    // 3) Түвшний туузууд (гаднаас дотогш ээлжилнэ)
    for (let k = levelsN; k >= 1; k--) {
      doc.circle(cx, cy, (L.R * k) / levelsN).fill(cfg.ringColors[(levelsN - k) % cfg.ringColors.length] || '#FFFFFF');
    }

    // 4) Тэнхлэгийн шугамууд
    for (let i = 0; i < n; i++) {
      const [ex, ey] = pt(L.R, wheelAxisAngle(i, n));
      doc.moveTo(cx, cy).lineTo(ex, ey).lineWidth(0.7).strokeColor(cfg.spokeColor).stroke();
    }

    // 5) Оноо — олон өнцөгт
    if (n >= 2) {
      let values: (number | null)[];
      if (this.demoMode || !this.currentResultCode) {
        values = cfg.axes.map((_, i) => wheelDemoValue(i, cfg));
      } else {
        const rows = await this.answerStats();
        values = cfg.axes.map((a) => {
          const expr = (a.value || '').trim();
          if (!expr) return wheelAxisValue(a, rows, cfg);
          const v = evalNumberExpression(expr, (key) => this.resolveTokens(`{{${key}}}`, ctx));
          return v != null && Number.isFinite(v) ? v : null;
        });
        if (values.every((v) => v == null)) {
          // Олон өнцөгт төвдөө шахагдаж харагдахгүй — шалтгааныг log-оос харахад.
          console.warn(
            `[DynamicTemplateRenderer] wheel-radar: ${this.currentResultCode} тэнхлэгийн утга олдсонгүй`,
            JSON.stringify({
              group: cfg.group || null,
              sub: cfg.sub || null,
              axes: cfg.axes.map((a) => [a.id ?? null, a.name, a.value || null]),
              stats: rows.map((r) => [r.id, r.parentId, r.name, r.categoryName, r.count]),
            }).slice(0, 2000),
          );
        }
      }
      const pts = values.map((v, i) => pt(L.R * wheelValueFraction(v, cfg), wheelAxisAngle(i, n)));
      doc.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
      doc.closePath();
      if (cfg.fillColor) {
        doc.fillColor(cfg.fillColor).fillOpacity(cfg.fillOpacity).fill();
        doc.fillOpacity(1);
        doc.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
        doc.closePath();
      }
      doc.lineWidth(cfg.lineWidth).lineJoin('round').strokeColor(cfg.lineColor).stroke();
    }

    // 6) Түвшний тэмдэг (Х, С, М, А, Ж)
    const markerFs = L.markerR * 1.25;
    for (const i of wheelMarkerAxes(n, cfg.markers)) {
      for (let k = 1; k <= levelsN; k++) {
        const [mx, my] = pt((L.R * k) / levelsN, wheelAxisAngle(i, n));
        doc.circle(mx, my, L.markerR).fill(cfg.markerColor);
        const code = cfg.levels[k - 1]?.code ?? '';
        this.safeFontWeight(doc, undefined, 'bold');
        doc.fontSize(markerFs).fillColor('#FFFFFF');
        const w = doc.widthOfString(code);
        doc.text(code, mx - w / 2, my - 0.5 * markerFs, { lineBreak: false });
      }
    }

    // 7) Гадна цагираг дээрх муруй бичиг
    if (n > 0) {
      const mid = (L.ringInner + L.outerR) / 2;
      const segArc = (2 * Math.PI) / n;
      cfg.axes.forEach((axis, i) => {
        const lines = wheelLabelLines(axis.label || axis.name);
        if (!lines.length) return;
        const a = wheelAxisAngle(i, n);
        const flip = Math.sin(rad(a)) > 0.01;
        this.safeFontWeight(doc, undefined, 'bold');
        doc.fontSize(L.labelFs);
        const charW = (ch: string) => doc.widthOfString(ch);
        const lineW = (t: string) => Array.from(t).reduce((acc, ch) => acc + charW(ch), 0);
        const widest = Math.max(...lines.map(lineW));
        let fs = L.labelFs;
        const maxArc = segArc * (mid - L.labelFs * 0.6) * 0.86;
        if (widest > maxArc) fs = (L.labelFs * maxArc) / widest;
        doc.fontSize(fs);
        const offs = lines.length === 2 ? [0.55 * fs, -0.55 * fs] : [0];
        lines.forEach((t, li) => {
          const r = mid + (flip ? -offs[li] : offs[li]);
          const chars = Array.from(t);
          const widths = chars.map(charW);
          const total = widths.reduce((x, y) => x + y, 0);
          const span = total / r;
          let acc = 0;
          chars.forEach((ch, ci) => {
            const w = widths[ci];
            const m = (acc + w / 2) / r;
            const ang = flip ? rad(a) + span / 2 - m : rad(a) - span / 2 + m;
            const px = cx + r * Math.cos(ang);
            const py = cy + r * Math.sin(ang);
            const rot = (ang * 180) / Math.PI + (flip ? -90 : 90);
            doc.save();
            doc.translate(px, py).rotate(rot);
            doc.fillColor(cfg.labelColor).text(ch, -w / 2, -0.5 * fs, { lineBreak: false });
            doc.restore();
            acc += w;
          });
        });
      });
    }

    doc.fillColor(colors.black);
    doc.strokeColor(colors.black);
    doc.lineWidth(1);
    doc.font(fontNormal);
    doc.x = x0;
    doc.y = y0 + L.height;
  }

  private renderLevelCards(doc: PDFKit.PDFDocument, block: any, ctx: RenderCtx) {
    const cfg = normalizeLevelCards(block.cards);
    const x0 = typeof block.x === 'number' ? block.x : marginX;
    const y0 = typeof block.y === 'number' ? block.y : doc.y;
    const width = Number(block.width) > 0 ? Number(block.width) : doc.page.width - x0 - marginX;
    const cols = levelCardColumns(width, cfg);
    if (!cols.length) return;
    const family = block.style?.fontFamily;
    const lineHeight = Number(block.style?.lineHeight) > 0 ? Number(block.style.lineHeight) : DEFAULT_LINE_HEIGHT;
    const drawBase = { ascent: GILROY_ASCENT, descent: GILROY_DESCENT };
    const colorBy = (base: string) => (seg: any) =>
      seg.link && !seg.accent ? LINK_COLOR : seg.accent ? seg.accentColor || colors.orange : base;

    const prepared = cfg.cards.map((card, i) => {
      const w = cols[i].w;
      const inner = Math.max(1, w - cfg.padding * 2);
      const title = this.resolveTokens(card.title, ctx);
      const subtitle = this.resolveTokens(card.subtitle, ctx);
      const body = this.resolveTokens(card.body, ctx);
      const titleL = title
        ? layoutRichText(doc, parseRichTextSegments(title), {
            width: Math.max(1, w - 12),
            fontSize: cfg.titleFontSize,
            lineHeight: DEFAULT_LINE_HEIGHT,
            align: 'center',
            setFont: this.richSetFont(doc, family, true),
          })
        : null;
      const subL = subtitle
        ? layoutRichText(doc, parseRichTextSegments(subtitle), {
            width: inner,
            fontSize: cfg.bodyFontSize,
            lineHeight,
            align: 'center',
            setFont: this.richSetFont(doc, family, true),
          })
        : null;
      const bodyL = body
        ? layoutRichText(doc, parseRichTextSegments(body), {
            width: inner,
            fontSize: cfg.bodyFontSize,
            lineHeight,
            align: 'center',
            setFont: this.richSetFont(doc, family),
          })
        : null;
      const contentH =
        cfg.padding * 2 +
        (subL ? subL.height : 0) +
        (subL && bodyL ? LEVEL_CARD_SUBTITLE_GAP : 0) +
        (bodyL ? bodyL.height : 0);
      return { card, titleL, subL, bodyL, contentH };
    });
    const cardH = cfg.headerHeight + Math.max(...prepared.map((p) => p.contentH));

    prepared.forEach((p, i) => {
      const x = x0 + cols[i].x;
      const w = cols[i].w;
      const r = Math.min(cfg.radius, w / 2, cardH / 2);
      doc.roundedRect(x, y0, w, cardH, r).fill(cfg.cardBg);
      const hh = cfg.headerHeight;
      if (hh > 0) {
        doc.roundedRect(x, y0, w, hh, Math.min(r, hh / 2)).fill(p.card.headerBg);
        if (hh > r) doc.rect(x, y0 + hh - r, w, r).fill(p.card.headerBg);
        if (p.titleL) {
          drawRichText(doc, p.titleL, x + 6, y0 + (hh - p.titleL.height) / 2, {
            ...drawBase,
            colorOf: colorBy(p.card.headerColor) as any,
          });
        }
      }
      let y = y0 + hh + cfg.padding;
      if (p.subL) {
        drawRichText(doc, p.subL, x + cfg.padding, y, { ...drawBase, colorOf: colorBy(p.card.subtitleColor) as any });
        y += p.subL.height + (p.bodyL ? LEVEL_CARD_SUBTITLE_GAP : 0);
      }
      if (p.bodyL) {
        drawRichText(doc, p.bodyL, x + cfg.padding, y, { ...drawBase, colorOf: colorBy(cfg.bodyColor) as any });
      }
    });
    doc.fillColor(colors.black);
    doc.font(fontNormal);
    doc.x = x0;
    doc.y = y0 + cardH;
  }

  // "custom-chart" — нэр, утгыг гараар өгдөг цагираг / дугуй / багана диаграм.
  // Геометр custom-chart.ts-д (Studio-той ижил зурах жагсаалт), энд зөвхөн PDFKit-ээр зурна.
  // "shape" — өнгөт талбай / хэвтээ, босоо шугам (studio/lib/shape.ts, ShapeView-тэй ижил):
  //   rect: width × height, дүүргэлт + дотогш хүрээ, булан; hline: урт = width, зузаан = height;
  //   vline: урт = height, зузаан = width.
  private renderShape(doc: PDFKit.PDFDocument, block: any) {
    const c = block.shape || {};
    const kind = c.kind === 'hline' || c.kind === 'vline' ? c.kind : 'rect';
    const num = (v: unknown, d: number, min: number, max: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
    };
    const color = String(c.color || (kind === 'rect' ? '#FFF5F2' : '#F36421'));
    const opacity = num(c.opacity, 1, 0, 1);
    const x = typeof block.x === 'number' ? block.x : marginX;
    const y = typeof block.y === 'number' ? block.y : doc.y;
    const w = Number(block.width) > 0 ? Number(block.width) : 100;
    const h = Number(block.height) > 0 ? Number(block.height) : 2;
    doc.save();
    doc.fillOpacity(opacity).strokeOpacity(opacity);
    if (kind === 'rect') {
      const r = num(c.radius, 8, 0, Math.min(w, h) / 2);
      const bw = num(c.borderWidth, 0, 0, 20);
      if (r > 0) doc.roundedRect(x, y, w, h, r).fill(color);
      else doc.rect(x, y, w, h).fill(color);
      if (bw > 0) {
        // CSS inset хүрээтэй адил — хүрээ талбайн ДОТОР.
        const ix = x + bw / 2, iy = y + bw / 2, iw = Math.max(0, w - bw), ih = Math.max(0, h - bw);
        doc.lineWidth(bw).strokeColor(String(c.borderColor || '#F36421'));
        if (r > 0) doc.roundedRect(ix, iy, iw, ih, Math.max(0, r - bw / 2)).stroke();
        else doc.rect(ix, iy, iw, ih).stroke();
      }
    } else {
      const horizontal = kind === 'hline';
      const t = horizontal ? h : w;
      const cx = x + w / 2, cy = y + h / 2;
      doc.lineWidth(t).strokeColor(color);
      if (c.dashed) doc.dash(t * 3, { space: t * 2 });
      if (horizontal) doc.moveTo(x, cy).lineTo(x + w, cy).stroke();
      else doc.moveTo(cx, y).lineTo(cx, y + h).stroke();
      doc.undash();
    }
    doc.restore();
    doc.fillColor(colors.black);
    doc.x = x;
    doc.y = y + h;
  }

  private renderCustomChart(doc: PDFKit.PDFDocument, block: any, ctx: RenderCtx) {
    const cfg = normalizeCustomChart(block.customChart);
    const x0 = typeof block.x === 'number' ? block.x : marginX;
    const y0 = typeof block.y === 'number' ? block.y : doc.y;
    const width = Number(block.width) > 0 ? Number(block.width) : doc.page.width - x0 - marginX;
    const family = block.style?.fontFamily;
    const evalExpr = (expr: string) =>
      evalNumberExpression(expr, (key) => this.resolveTokens(`{{${key}}}`, ctx));
    const values = cfg.items.map((it) => evalExpr(it.value));
    const yMax = cfg.yMax.trim() ? evalExpr(cfg.yMax) : null;
    const measure = (t: string, fs: number, bold: boolean) => {
      this.safeFontWeight(doc, family, bold ? 'bold' : 'normal');
      doc.fontSize(fs);
      return doc.widthOfString(t);
    };
    const { prims, height } = customChartDisplay(width, cfg, values, measure, yMax);
    doc.save();
    doc.translate(x0, y0);
    for (const p of prims) {
      if (p.k === 'path') {
        if (p.stroke) doc.path(p.d).lineWidth(p.sw ?? 0.8).fillAndStroke(p.fill, p.stroke);
        else doc.path(p.d).fill(p.fill);
      } else if (p.k === 'rect') {
        doc.rect(p.x, p.y, p.w, p.h).fill(p.fill);
      } else if (p.k === 'line') {
        doc.moveTo(p.x1, p.y1).lineTo(p.x2, p.y2).lineWidth(p.w).strokeColor(p.color).stroke();
      } else if (p.k === 'text') {
        this.safeFontWeight(doc, family, p.bold ? 'bold' : 'normal');
        doc.fontSize(p.fs).fillColor(p.color).text(p.text, p.x, p.y, { lineBreak: false });
      }
    }
    doc.restore();
    doc.fillColor(colors.black);
    doc.font(fontNormal);
    doc.x = x0;
    doc.y = y0 + height;
  }

  private renderProgressBar(doc: PDFKit.PDFDocument, block: any, ctx: RenderCtx) {
    const cfg = normalizeProgress(block.progress);
    const x0 = typeof block.x === 'number' ? block.x : marginX;
    const y0 = typeof block.y === 'number' ? block.y : doc.y;
    const width = Number(block.width) > 0 ? Number(block.width) : doc.page.width - x0 - marginX;
    const family = block.style?.fontFamily;
    const v = evalNumberExpression(cfg.value, (key) => this.resolveTokens(`{{${key}}}`, ctx));
    // "0 үед нуух" — шошго, bar, хувь аль нь ч зурагдахгүй (блокууд x/y-аар байрладаг
    // тул дараагийн блокийн байрлал өөрчлөгдөхгүй).
    if (progressHidden(cfg, v)) {
      doc.x = x0;
      doc.y = y0;
      return;
    }
    const f = progressFraction(v);
    const label = this.resolveTokens(cfg.label, ctx);
    const lh = cfg.labelFontSize * DEFAULT_LINE_HEIGHT;
    // Шошго урт бол labelWidth-д багтаан олон мөрөөр (өмнө нь 1 мөрөөр тасалдаг байв) —
    // блокийн өндөр мөрийн тоогоор өсч, bar ба хувь нь шошготой босоо тэнхлэгээр төвлөрнө
    // (Studio ProgressBarView-тэй ижил).
    const L = label
      ? layoutRichText(doc, parseRichTextSegments(label), {
          width: Math.max(1, cfg.labelWidth - 4),
          fontSize: cfg.labelFontSize,
          lineHeight: DEFAULT_LINE_HEIGHT,
          align: 'left',
          breakLongWords: true,
          setFont: this.richSetFont(doc, family, true),
        })
      : null;
    const labelH = L && L.lines.length ? L.height : 0;
    const H = Math.max(progressHeight(cfg), labelH);
    let bx = x0;
    if (L && L.lines.length) {
      drawRichText(doc, L as any, x0, y0 + (H - labelH) / 2, {
        ascent: GILROY_ASCENT,
        descent: GILROY_DESCENT,
        colorOf: (() => cfg.labelColor) as any,
      });
      bx = x0 + cfg.labelWidth;
    }
    const valueText = `${Math.round(f * 100)}%`;
    let valueW = 0;
    if (cfg.showValue) {
      this.safeFontWeight(doc, family, 'bold');
      doc.fontSize(cfg.labelFontSize);
      valueW = doc.widthOfString('100%') + 8;
    }
    const bw = Math.max(1, x0 + width - bx - valueW);
    const bh = cfg.barHeight;
    const by = y0 + (H - bh) / 2;
    doc.roundedRect(bx, by, bw, bh, bh / 2).fill(cfg.trackColor);
    const fw = bw * f;
    if (fw > 0) {
      const grad = doc.linearGradient(bx, by, bx + fw, by);
      grad.stop(0, cfg.colorFrom).stop(1, cfg.colorTo || cfg.colorFrom);
      doc.roundedRect(bx, by, fw, bh, Math.min(bh / 2, fw / 2)).fill(grad);
    }
    if (cfg.showValue) {
      this.safeFontWeight(doc, family, 'bold');
      doc.fontSize(cfg.labelFontSize).fillColor(cfg.valueColor);
      const tw = doc.widthOfString(valueText);
      doc.text(valueText, x0 + width - tw, y0 + (H - lh) / 2, { lineBreak: false });
    }
    doc.fillColor(colors.black);
    doc.font(fontNormal);
    doc.x = x0;
    doc.y = y0 + H;
  }
}
