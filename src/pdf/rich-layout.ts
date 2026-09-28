// ─────────────────────────────────────────────────────────────────────────────
// Rich text layout engine — Studio Canvas (Chrome, `white-space: pre-wrap`)-тай
// ЯГ адил мөр таслалт/байрлалаар PDF-д текст зурна.
//
// Яагаад PDFKit-ийн өөрийн "continued" урсгалыг ашиглахгүй вэ:
//  1. PDFKit мөрийн төгсгөлийн үгийн АРДАХ ЗАЙГ өргөнд тооцдог (Chrome-д
//     мөрийн төгсгөлийн зай "унжина", тооцогдохгүй) → PDF нь Studio-оос
//     эрт мөр таслаж, текст нэг мөрөөр урт болж доорх блоктой давхцдаг байв.
//  2. "continued" хэсэг дотор "\n" орвол шинэ догол мөр бүр өмнөх хэсгийн
//     төгсгөлийн X-ээс (continuedX) эхэлдэг PDFKit-ийн алдаа — **тод** үгийн
//     дараах догол мөр баруун тийш шилжиж гардаг байв.
//  3. Олон өнгө/фонттой хэсэгтэй мөрөнд center/right/justify зөв ажилладаггүй.
//
// Энд: UAX#14 (Chrome-той адил) тасалгааны цэгүүдийг `linebreak`-ээр олж,
// үг бүрийг хэмжиж, мөрөнд өөрсдөө хуваарилж, run бүрийг
// doc.text(..., { lineBreak: false })-ээр яг тооцоолсон X/Y-д зурна.
// ─────────────────────────────────────────────────────────────────────────────

// `linebreak` нь pdfkit-ийн шууд dependency (node_modules-д үргэлж байна).
// Ямар нэг шалтгаанаар олдохгүй бол зай/зураасны ард таслах энгийн
// fallback ашиглана.
let LineBreaker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LineBreaker = require('linebreak');
} catch {
  LineBreaker = null;
}
class SimpleBreaker {
  private re = /[^\s\-\u2013\u2014]*[\-\u2013\u2014]*[ \t]*(\r\n|\n|\r)?/g;
  constructor(private s: string) {}
  nextBreak(): { position: number; required: boolean } | null {
    if (this.re.lastIndex >= this.s.length) return null;
    const m = this.re.exec(this.s);
    if (!m || m[0] === '') {
      this.re.lastIndex = this.s.length;
      return this.s.length ? { position: this.s.length, required: false } : null;
    }
    return { position: this.re.lastIndex, required: !!m[1] };
  }
}

export interface RichSeg {
  text: string;
  bold?: boolean;
  black?: boolean;
  italic?: boolean;
  accent?: boolean;
  accentColor?: string;
  link?: string;
}

export interface RichLayoutOptions {
  width: number;
  fontSize: number;
  // CSS line-height (фонтын хэмжээний үржүүлэг). Мөрийн алхам = lineHeight × fontSize.
  lineHeight: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  // Нэг үг өргөнөөс урт бол тэмдэгтээр таслах (CSS overflow-wrap: break-word).
  // false бол Chrome-ийн анхдагч шиг хэтрүүлж (overflow) зурна.
  breakLongWords?: boolean;
  // Сегментэд тохирох фонтыг doc дээр тавина (жин/налуу).
  setFont: (seg: RichSeg) => void;
}

interface Run {
  seg: RichSeg;
  text: string; // зай орсон байж болно
  width: number;
}
interface Word {
  runs: Run[];
  width: number; // нийт (ардах зай орсон)
  trailWidth: number; // ардах зайн өргөн (мөрийн төгсгөлд унжина)
  trailSpaces: number; // ардах зайн тоо (justify-д)
  hardBreak: boolean; // ард нь "\n" — догол мөр дуусна
}
export interface RichLine {
  words: Word[];
  contentWidth: number; // сүүлийн үгийн ардах зайгүй өргөн
  endsParagraph: boolean;
}
export interface RichLayout {
  lines: RichLine[];
  height: number;
  lineAdvance: number;
  opts: RichLayoutOptions;
}

function measure(doc: any, opts: RichLayoutOptions, seg: RichSeg, text: string): number {
  if (!text) return 0;
  opts.setFont(seg);
  doc.fontSize(opts.fontSize);
  return doc.widthOfString(text);
}

function splitRunsToWords(doc: any, segs: RichSeg[], opts: RichLayoutOptions): Word[] {
  const full = segs.map((s) => s.text).join('');
  if (!full) return [];
  // тэмдэгт бүрийн сегментийн индекс
  const segOf: number[] = [];
  segs.forEach((s, i) => {
    for (let k = 0; k < s.text.length; k++) segOf.push(i);
  });
  const words: Word[] = [];
  const breaker = LineBreaker ? new LineBreaker(full) : new SimpleBreaker(full);
  let last = 0;
  let bk: any;
  const pushWord = (start: number, end: number, required: boolean) => {
    let chunk = full.slice(start, end);
    let hard = false;
    // шаардлагатай тасалгаа — "\n" (эсвэл \r\n)-ийг таслаад хаяна
    if (required) {
      const m = chunk.match(/(\r\n|\n|\r)$/);
      if (m) {
        chunk = chunk.slice(0, -m[0].length);
        end -= m[0].length;
      }
      hard = true;
    }
    const runs: Run[] = [];
    let i = start;
    while (i < end) {
      const si = segOf[i];
      let j = i;
      while (j < end && segOf[j] === si) j++;
      const t = full.slice(i, j);
      runs.push({ seg: segs[si], text: t, width: measure(doc, opts, segs[si], t) });
      i = j;
    }
    // ардах зай (сүүлийн run-ий төгсгөлийн зай)
    let trailWidth = 0;
    let trailSpaces = 0;
    const lastRun = runs[runs.length - 1];
    const allSpace = /^[ \t]*$/.test(chunk);
    if (lastRun && !allSpace) {
      const m = lastRun.text.match(/[ \t]+$/);
      if (m) {
        trailSpaces = m[0].length;
        trailWidth = lastRun.width - measure(doc, opts, lastRun.seg, lastRun.text.slice(0, -m[0].length));
      }
    }
    const width = runs.reduce((a, r) => a + r.width, 0);
    words.push({ runs, width, trailWidth, trailSpaces, hardBreak: hard });
  };
  while ((bk = breaker.nextBreak())) {
    // Chrome (Blink) нь UAX#14-ийн "/" гэх мэт зарим тасалгааг (URL дотор)
    // ашигладаггүй — зөвхөн зай, зураас (-‐–—) болон "\n"-ийн ард таслана.
    const prev = full[bk.position - 1];
    if (!bk.required && bk.position < full.length && !/[\s\-\u2010\u2013\u2014]/.test(prev) && full[bk.position] !== '\u2014') continue;
    pushWord(last, bk.position, !!bk.required);
    last = bk.position;
  }
  if (last < full.length) pushWord(last, full.length, false);
  return words;
}

// Нэг үгийг тэмдэгтээр хуваах (breakLongWords)
function splitLongWord(doc: any, opts: RichLayoutOptions, w: Word, maxW: number): Word[] {
  const out: Word[] = [];
  let cur: Run[] = [];
  let curW = 0;
  for (const r of w.runs) {
    let buf = '';
    for (const ch of Array.from(r.text)) {
      const cw = measure(doc, opts, r.seg, buf + ch);
      if (curW + cw > maxW && (buf || cur.length)) {
        if (buf) cur.push({ seg: r.seg, text: buf, width: measure(doc, opts, r.seg, buf) });
        out.push({ runs: cur, width: cur.reduce((a, x) => a + x.width, 0), trailWidth: 0, trailSpaces: 0, hardBreak: false });
        cur = [];
        curW = 0;
        buf = ch;
      } else buf += ch;
    }
    if (buf) {
      const bw = measure(doc, opts, r.seg, buf);
      cur.push({ seg: r.seg, text: buf, width: bw });
      curW += bw;
    }
  }
  if (cur.length) out.push({ runs: cur, width: cur.reduce((a, x) => a + x.width, 0), trailWidth: w.trailWidth, trailSpaces: w.trailSpaces, hardBreak: w.hardBreak });
  return out;
}

export function layoutRichText(doc: any, segs: RichSeg[], opts: RichLayoutOptions): RichLayout {
  const lineAdvance = opts.lineHeight * opts.fontSize;
  let words = splitRunsToWords(doc, segs.filter((s) => s.text), opts);
  if (opts.breakLongWords) {
    const expanded: Word[] = [];
    for (const w of words) {
      if (w.width - w.trailWidth > opts.width) expanded.push(...splitLongWord(doc, opts, w, opts.width));
      else expanded.push(w);
    }
    words = expanded;
  }
  const lines: RichLine[] = [];
  let cur: Word[] = [];
  let used = 0; // одоогийн мөрийн өргөн (бүх үгийн нийт, ардах зай орсон)
  const finish = (endsParagraph: boolean) => {
    const lastW = cur[cur.length - 1];
    const contentWidth = cur.length ? used - (lastW ? lastW.trailWidth : 0) : 0;
    lines.push({ words: cur, contentWidth, endsParagraph });
    cur = [];
    used = 0;
  };
  for (const w of words) {
    const fits = cur.length === 0 || used + (w.width - w.trailWidth) <= opts.width + 0.001;
    if (!fits) finish(false);
    cur.push(w);
    used += w.width;
    if (w.hardBreak) finish(true);
  }
  if (cur.length || lines.length === 0 || (words.length && words[words.length - 1].hardBreak)) {
    // "\n"-ээр дууссан текст → Chrome хоосон мөр нэмдэггүй (pre-wrap-д сүүлийн
    // "\n" нэмэлт хоосон мөр ҮҮСГЭНЭ) — Chrome: pre-wrap-д төгсгөлийн \n-ийн
    // ард хоосон мөр зурагдахгүй. Иймд зөвхөн агуулгатай үед л нэмнэ.
    if (cur.length) finish(true);
  }
  if (lines.length) lines[lines.length - 1].endsParagraph = true;
  return { lines, height: lines.length * lineAdvance, lineAdvance, opts };
}

export interface DrawRichOptions {
  // Сегментийн өнгө
  colorOf: (seg: RichSeg) => string;
  // Фонтын ascent/descent (1000-д) — Chrome-ийн half-leading-тай тааруулахад
  ascent: number;
  descent: number; // эерэг утга (жиш 226)
}

export function drawRichText(doc: any, layout: RichLayout, x: number, y: number, d: DrawRichOptions) {
  const { opts, lineAdvance } = layout;
  const size = opts.fontSize;
  // CSS: мөрийн хайрцаг (lineAdvance) дотор content area (ascent+descent) босоо
  // төвлөрнө → PDFKit текстийн дээд (ascent) шугам = мөрийн дээд + half-leading.
  const halfLeading = (lineAdvance - ((d.ascent + d.descent) / 1000) * size) / 2;
  layout.lines.forEach((line, li) => {
    const ly = y + li * lineAdvance + halfLeading;
    const free = opts.width - line.contentWidth;
    let lx = x;
    let extraPerSpace = 0;
    const align = opts.align || 'left';
    if (align === 'right') lx = x + free;
    else if (align === 'center') lx = x + free / 2;
    else if (align === 'justify' && !line.endsParagraph && free > 0) {
      const spaces = line.words.slice(0, -1).reduce((a, w) => a + w.trailSpaces, 0);
      if (spaces > 0) extraPerSpace = free / spaces;
    }
    line.words.forEach((w, wi) => {
      const isLast = wi === line.words.length - 1;
      w.runs.forEach((r, ri) => {
        let text = r.text;
        // мөрийн төгсгөлийн үгийн ардах зайг зурахгүй (link underline сунахгүй)
        if (isLast && ri === w.runs.length - 1) text = text.replace(/[ \t]+$/, '');
        if (text) {
          opts.setFont(r.seg);
          doc.fontSize(size);
          doc.fillColor(d.colorOf(r.seg));
          // textWidth/wordCount — PDFKit lineBreak:false үед эдгээрийг
          // тооцдоггүй тул underline (link) зурахад NaN болдог.
          const tw = text === r.text ? r.width : doc.widthOfString(text);
          doc.text(text, lx, ly, {
            lineBreak: false,
            link: r.seg.link || null,
            underline: !!r.seg.link,
            textWidth: tw,
            wordCount: 1,
          });
        }
        lx += r.width;
      });
      if (!isLast) lx += w.trailSpaces * extraPerSpace;
    });
  });
  return layout.height;
}
