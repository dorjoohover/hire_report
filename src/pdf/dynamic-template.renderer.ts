import { Injectable } from '@nestjs/common';
import axios from 'axios';
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
}
function parseRichTextSegments(content: string): RichTextSegment[] {
  if (!content) return [];
  const segments: RichTextSegment[] = [];
  let bold = false;
  let black = false;
  let accent = false;
  let accentColor: string | undefined;
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) segments.push({ text: buf, bold, black, accent, accentColor });
    buf = '';
  };
  while (i < content.length) {
    if (content.startsWith('**', i)) {
      flush();
      bold = !bold;
      i += 2;
    } else if (content.startsWith('~~', i)) {
      flush();
      black = !black;
      i += 2;
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
    this.safeFont(doc, undefined, true);
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
  ) {
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
    // Нэг "энгийн" (bracket-гүй) token-ийг эрэмбийн дагуу шийднэ: AI Data
    // JSON (aiJsonData) → хэрэглэгчийн variable (custom./result.<key>,
    // result.result-оор автоматаар шүүгдсэн) → hardcoded "values" map.
    const resolveSimple = (key: string): string => {
      if (this.currentAiJsonData) {
        const jsonVal = this.getByPath(this.currentAiJsonData, key);
        if (jsonVal !== undefined && jsonVal !== null) {
          return typeof jsonVal === 'object' ? JSON.stringify(jsonVal) : String(jsonVal);
        }
      }
      if (this.currentCustomVariableTokens[key] !== undefined) {
        return this.currentCustomVariableTokens[key];
      }
      return values[key] !== undefined ? values[key] : '';
    };

    return content.replace(/\{\{\s*([\w.\[\]]+)\s*\}\}/g, (_m, key) => {
      // {{custom.<key>[<indexPath>]}} — ДУРЫН зам (жиш нь "result.result")-аар
      // хэрэглэгчийн variable-ийн ТҮҮХИЙ entries-ээс индексжүүлж уншина
      // (жишээ нь {{custom.characterDescription[result.result]}}) — auto
      // "result.<key>" alias-аас ялгаатай нь ЭНД indexPath-ийг хэрэглэгч
      // өөрөө сонгоно (result.result-оор хязгаарлагдахгүй).
      const bracketMatch = key.match(/^custom\.([\w]+)\[([\w.]+)\]$/);
      if (bracketMatch) {
        const [, varKey, indexPath] = bracketMatch;
        const entries = this.currentCustomVariableEntries[varKey];
        if (entries) {
          const indexValue = resolveSimple(indexPath);
          const entryVal = indexValue ? entries[indexValue.toLowerCase()] : undefined;
          if (entryVal !== undefined) return entryVal;
        }
        return '';
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
    const key = `${result.code}:${result.type}`;
    if (this.categoriesCache.has(key)) return this.categoriesCache.get(key)!;
    const rows = await this.userAnswer.partialCalculator(
      result.code,
      result.type,
    );
    this.categoriesCache.set(key, rows);
    return rows;
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
    const assessmentId = (exam as any)?.assessment?.id;
    if (assessmentId) {
      try {
        const variables = await this.variableDao.findAllByAssessmentId(assessmentId);
        const resultKey = result?.result ? result.result.toLowerCase() : undefined;
        for (const v of variables) {
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
        home(
          doc,
          assetService,
          lastname ?? '',
          firstname ?? '',
          result?.assessmentName || exam?.assessmentName || '',
          exam?.code ?? '',
        );
        if (pageIndex < pages.length - 1) doc.addPage();
        continue;
      }

      if (page.backgroundColor && page.backgroundColor.toUpperCase() !== '#FFFFFF') {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(page.backgroundColor);
        doc.fillColor(colors.black);
      }

      // Тухайн хуудсанд ТУСДАА "user-name" блок нэмсэн бол header/title10
      // built-in avatar+нэрийг давхардуулахгүй байх ёстой — studio дээр
      // хэрэглэгч эдгээрийг хамт ашигласан гэдгийг энд илрүүлнэ.
      const pageHasUserName = blocks.some((b) => b.type === 'user-name');

      for (const block of blocks) {
        try {
          await this.renderBlock(doc, block, ctx, assetService, pageHasUserName);
        } catch (err) {
          // Нэг блок амжилтгүй болсноор бүх тайлан унахгүй — алгасаад үргэлжлүүлнэ.
          console.warn(
            `[DynamicTemplateRenderer] block "${block.type}" (id=${block.id}) failed:`,
            err?.message ?? err,
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
        title10(
          doc,
          assetService,
          firstname ?? '',
          lastname ?? '',
          result?.assessmentName ?? exam?.assessmentName,
          !pageHasUserName,
        );
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
        title(doc, assetService, titleText, assessment?.author);
        break;
      }
      case 'user-name': {
        // header()/title10() дотор built-in байдаг "Шалгуулагч + нэр" хэсгийг
        // ТУСДАА, block.x/y дээр зурна (header()/title10()-ийг бүхэлд нь
        // дуудахгүй тул давхарлагдахгүй). Studio-ийн ReportUserName
        // (Canvas.tsx) preview-тэй яг ижил дизайн — дээд талд оранж шугам +
        // доор нь avatar+нэр.
        const bx = doc.x;
        const by = doc.y;
        const lineWidth = blockWidth ?? 200;
        doc
          .moveTo(bx, by + 8)
          .strokeColor(colors.orange)
          .lineWidth(1.5)
          .lineTo(bx + lineWidth, by + 8)
          .stroke();

        const rowY = by + 19.5; // 8 (line offset) + 1.5 (line) + 10 (margin)
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
        this.safeFont(doc, block.style?.fontFamily, true);
        doc
          .fontSize(block.style?.fontSize || 16)
          .fillColor(block.style?.color || colors.orange)
          .text(text, headingX, doc.y, { width: blockWidth, align: headingAlign });
        // Зүүн зэрэгцүүлэлтийн үед л дэд шугам гарчигтай зэрэгцэнэ — төв/баруун
        // үед бол доод шугамыг гарчгийн бодит текстийн эхлэлд биш харин
        // блокийн эхэнд зурсаар үлдээнэ (энгийн, урьдчилан тооцоолохгүй).
        doc
          .moveTo(headingX, doc.y + 2)
          .strokeColor(block.style?.color || colors.orange)
          .lineTo(headingX + 60, doc.y + 2)
          .stroke();
        break;
      }
      case 'text': {
        const text = this.resolveTokens(block.content, ctx);
        if (!text) break;
        const baseColor = block.style?.color || colors.black;
        // seg.accent > boldColor (**тод**/~~хар~~ сегментийн тусдаа өнгө,
        // тавигдсан бол) > энгийн текст өнгө — эрэмбийн дагуу шийднэ.
        const segColor = (seg: { accent: boolean; accentColor?: string; bold: boolean; black: boolean }) =>
          seg.accent
            ? (seg.accentColor || colors.orange)
            : (seg.bold || seg.black) && block.style?.boldColor
              ? block.style.boldColor
              : baseColor;
        doc.fontSize(block.style?.fontSize || 12);

        // "Жагсаалт" формат — content-ийн мөр (\n) бүрийг урд нь "•" bullet +
        // зайтай жагсаалтын мөр болгож зурна (RightPanel.tsx-ийн "Формат"
        // сонголт). Мөр бүр ТУСДАА rich-text задлагдана (**тод**/~~хар~~/
        // ==онцолсон== мөр доторх ажиллана).
        if (block.style?.listStyle === 'list') {
          const listX = block.x ?? marginX;
          const listWidth = blockWidth || doc.page.width - listX - marginX;
          const bulletChar = '• ';
          this.safeFont(doc, block.style?.fontFamily, false);
          const bulletIndent = doc.widthOfString(bulletChar) + 2;
          const itemWidth = Math.max(0, listWidth - bulletIndent);
          const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
          lines.forEach((line) => {
            const rowY = doc.y;
            doc.fillColor(baseColor);
            this.safeFont(doc, block.style?.fontFamily, false);
            doc.text(bulletChar, listX, rowY, { width: bulletIndent, continued: false, align: 'left' });
            const segs = parseRichTextSegments(line);
            segs.forEach((seg, idx) => {
              this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal');
              doc.fillColor(segColor(seg));
              const opts: any = { continued: idx < segs.length - 1, width: itemWidth, align: 'left' };
              if (idx === 0) doc.text(seg.text, listX + bulletIndent, rowY, opts);
              else doc.text(seg.text, opts);
            });
          });
          doc.fillColor(colors.black);
          doc.font(fontNormal);
          doc.x = listX;
          break;
        }

        // Studio-ийн RightPanel-д бичсэн **тод**, ~~хар~~ болон ==онцолсон==
        // (accent өнгө) тэмдэглэгээг PDFKit-ийн "continued" text урсгалаар
        // мөрийн дотор холилдуулан зурна (studio/lib/richtext.ts-тэй адил
        // логик — өөр service тул энд тусад нь давхардуулав).
        const segments = parseRichTextSegments(text);
        const align = (block.style?.textAlign as any) || 'left';
        const width = blockWidth || doc.page.width - (block.x ?? marginX) - marginX;
        const textX = doc.x;
        const textY = doc.y;
        // PDFKit-ийн "continued" урсгал зөвхөн ЭХНИЙ .text() дуудлагын
        // align/width-ийг мэддэг тул хэд хэдэн сегмент (**тод**/~~хар~~/
        // ==онцолсон== холилдсон) байх үед center/right сонгосон ч зөвхөн
        // эхний сегмент л зөв байрлаж, дараагийн сегментүүд түүний ард
        // "зүүн зэрэгцүүлэлт"-тэй адилаар гарч ирдэг байсан (Studio-д
        // center/justify сонгоод ч бодит PDF дээр margin 40-т зүүн
        // зэрэгцсэн хэвээр гарч байсан алдаа). Иймд center/right үед бүх
        // сегментийн нийт өргөнийг өөрсдөө тооцоолж эхлэх X-ийг олно.
        let startX = textX;
        if (align === 'center' || align === 'right') {
          let totalWidth = 0;
          for (const seg of segments) {
            this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal');
            totalWidth += doc.widthOfString(seg.text);
          }
          if (align === 'center') startX = textX + Math.max(0, (width - totalWidth) / 2);
          else startX = textX + Math.max(0, width - totalWidth);
        }
        // justify — зөвхөн ганц сегмент (rich text тэмдэглэгээгүй, олон мөрөнд
        // хуваагдаж болох энгийн текст) үед л PDFKit-ийн жинхэнэ paragraph
        // justify (үг хоорондын зайг сунгах) зөв ажиллана. Хэд хэдэн сегмент
        // (өөр өөр фонт/өнгөтэй) холилдсон үед үг хоорондын зайг зөв тооцох
        // боломжгүй тул left байдлаар унана (тодорхой uzegdeh ялгаа багатай —
        // ихэнхдээ богино нэг мөр текст байдаг тул).
        segments.forEach((seg, idx) => {
          // black нь bold-той зэрэг идэвхтэй бол давамгайлна (илүү хүнд жин).
          this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal');
          doc.fillColor(segColor(seg));
          const useNativeAlign = align === 'left' || (align === 'justify' && segments.length === 1);
          const opts: any = {
            continued: idx < segments.length - 1,
            width,
            align: useNativeAlign ? align : 'left',
          };
          if (idx === 0) {
            doc.text(seg.text, startX, textY, opts);
          } else {
            doc.text(seg.text, opts);
          }
        });
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
      case 'chart': {
        await this.renderGraphic(doc, block, ctx, assetService);
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
            const response = await axios.get(block.imageUrl, { responseType: 'arraybuffer' });
            iconBuffer = Buffer.from(response.data);
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
            this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal');
            // seg.accent > boldColor (эхний **тод шинж нэр**-ийг тусад нь
            // өнгөөр ялгах, RightPanel.tsx-ийн "Тод үгийн өнгө") > энгийн өнгө.
            doc.fillColor(
              seg.accent
                ? (seg.accentColor || colors.orange)
                : (seg.bold || seg.black) && block.style?.boldColor
                  ? block.style.boldColor
                  : baseColor,
            );
            const opts: any = { continued: idx < segments.length - 1, width: textWidth, align: 'justify' };
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
            const query = `select point, "qac".name from "userAnswer" inner join "questionAnswerCategory" qac on qac.id = "answerCategoryId" where code = $1`;
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

        this.safeFont(doc, block.style?.fontFamily, true);
        doc.fontSize(12).fillColor(colors.black);
        doc.text('Нийт оноо ', barX, doc.y, { continued: true });
        doc.fillColor(colors.orange).fontSize(15).text(`${point}`, { continued: true });
        doc.fillColor(colors.black).text(`/${total}`);

        const barY = doc.y + 6;
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
        const segColor = (seg: { accent: boolean; accentColor?: string; bold: boolean; black: boolean }) =>
          seg.accent
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
            this.safeFontWeight(doc, block.style?.fontFamily, seg.black ? 'black' : seg.bold ? 'bold' : 'normal');
            doc.fillColor(segColor(seg));
            const opts: any = { continued: idx < segs.length - 1, width: levelWidth, align: 'left' };
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
        this.safeFont(doc, block.style?.fontFamily, true);
        doc.fontSize(12).fillColor(colors.black);
        doc.text('Нийт оноо ', levelX, doc.y, { continued: true });
        doc.fillColor(colors.orange).fontSize(15).text(hasScore ? `${rawScore}` : '—', { continued: true });
        doc.fillColor(colors.black).text(`/${scoreMax}`);

        const barY = doc.y + 6;
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
    if (block.type === 'image' && block.imageUrl) {
      try {
        const response = await axios.get(block.imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        doc.image(buffer, x, y, { width, height: block.height || undefined, fit: [width, block.height || width] });
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
}
