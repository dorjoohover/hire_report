// ─────────────────────────────────────────────────────────────────────────────
// Монгол нэртэй хувьсагч — {{Нийт оноо}}, {{Онооны хувь}}, {{1-р бүлгийн нэр}},
// {{<хэрэглэгчийн хувьсагчийн харагдах нэр>}} гэх мэтийг дотоод token
// ({{score.total}}, {{category[1].name}}, {{custom.<key>}}) руу хөрвүүлнэ.
// Хуучин (англи) token-ууд хэвээр ажиллана.
//
// studio/lib/tokenAliases.ts ↔ hire_report/src/pdf/token-aliases.ts — ЯГ АДИЛ
// (өөр service тул давхардуулав — өөрчлөхдөө хоёуланг нь синк байлгах).
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenName {
  name: string; // Монгол нэр ({{…}} дотор бичигдэнэ)
  key: string; // дотоод token
}

// Үндсэн (built-in) талбарууд — эхнийх нь тухайн key-ийн 'үндсэн' нэр.
export const BUILTIN_TOKEN_NAMES: TokenName[] = [
  { name: 'Нэр', key: 'user.firstname' },
  { name: 'Овог', key: 'user.lastname' },
  { name: 'Овог нэр', key: 'user.fullname' },
  { name: 'И-мэйл', key: 'user.email' },
  { name: 'Регистр', key: 'user.registerNumber' },
  { name: 'Төрсөн огноо', key: 'user.birthdate' },
  { name: 'Хүйс', key: 'user.gender' },
  { name: 'Мэргэжил', key: 'user.occupation' },
  { name: 'Шалгалтын код', key: 'exam.code' },
  { name: 'Эхэлсэн цаг', key: 'exam.startedAt' },
  { name: 'Дууссан цаг', key: 'exam.finishedAt' },
  { name: 'Үргэлжилсэн хугацаа', key: 'exam.duration' },
  { name: 'Тестийн нэр', key: 'assessment.name' },
  { name: 'Зохиогч', key: 'assessment.author' },
  { name: 'Тестийн тухай', key: 'assessment.about' },
  { name: 'Тестийн хэрэглээ', key: 'assessment.usage' },
  { name: 'Нийт оноо', key: 'score.total' },
  { name: 'Дээд оноо', key: 'score.max' },
  { name: 'Онооны хувь', key: 'score.percent' },
  { name: 'Дундаж оноо', key: 'score.avg' },
  { name: 'Квартил', key: 'assessment.quartile' },
  { name: 'Квартил нэр', key: 'assessment.quartileLabel' },
  { name: 'Тайлангийн код', key: 'report.code' },
  { name: 'Тайлангийн огноо', key: 'report.date' },
  { name: 'Тест дуусгасан огноо', key: 'report.generatedAt' },
  { name: 'Бүлгийн тоо', key: 'category.count' },
  { name: 'Хэв шинжийн нэр', key: 'result.valueLabel' },
  { name: 'Хэв шинжийн код', key: 'result.value' },
  { name: 'Хэв шинжийн тайлбар', key: 'result.characterDescription' },
  { name: 'Загварын нэр', key: 'result.styleLabel' },
  { name: 'Загварын код', key: 'result.resultCode' },
];

// {{N-р бүлгийн <талбар>}} → {{category[N].<field>}}
export const CATEGORY_FIELD_NAMES: TokenName[] = [
  { name: 'нэр', key: 'name' },
  { name: 'дундаж оноо', key: 'avg' },
  { name: 'дундаж', key: 'avg' },
  { name: 'оноо', key: 'score' },
  { name: 'нийт оноо', key: 'score' },
  { name: 'дээд оноо', key: 'max' },
  { name: 'хувь', key: 'percent' },
  { name: 'онооны хувь', key: 'percent' },
  { name: 'асуултын тоо', key: 'count' },
];

// Хэрэглэгчийн хувьсагч: label = 'Харагдах нэр', key = код ('custom.'-гүй).
export interface CustomTokenName {
  label?: string | null;
  key: string;
}

const norm = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const ASCII_KEY_RE = /^[\w.\[\]]+$/;
const BUILTIN_BY_NAME = new Map(BUILTIN_TOKEN_NAMES.map((t) => [norm(t.name), t.key]));
const CATEGORY_BY_NAME = new Map(CATEGORY_FIELD_NAMES.map((t) => [norm(t.name), t.key]));

function customByLabel(customs: CustomTokenName[], label: string): string | null {
  const want = norm(label);
  if (!want) return null;
  const hit = (customs || []).find((c) => c?.label && norm(c.label) === want);
  return hit ? hit.key : null;
}

// Монгол нэрийг дотоод token болгоно; танигдахгүй бол null (текст хэвээр үлдэнэ).
export function tokenNameToKey(raw: string, customs: CustomTokenName[] = []): string | null {
  const name = (raw || '').trim();
  if (!name || /[{}]/.test(name)) return null;
  // Англи token (score.total, custom.x[1]) — хэвээр. Гэхдээ цэггүй латин
  // харагдах нэр (жиш 'Level') хэрэглэгчийн хувьсагчтай таарвал түүнийг авна.
  if (ASCII_KEY_RE.test(name)) {
    if (!name.includes('.') && !name.includes('[')) {
      const c = customByLabel(customs, name);
      if (c) return `custom.${c}`;
    }
    return null;
  }
  const n = norm(name);
  const builtin = BUILTIN_BY_NAME.get(n);
  if (builtin) return builtin;

  // {{3-р бүлгийн нэр}} / {{3-р бүлгийн <хувьсагчийн нэр>}}
  const cat = n.match(/^(\d+)\s*-?\s*(?:р|дугаар)?\s*бүлгийн\s+(.+)$/);
  if (cat) {
    const idx = cat[1];
    const field = CATEGORY_BY_NAME.get(cat[2]);
    if (field) return `category[${idx}].${field}`;
    const c = customByLabel(customs, cat[2]);
    if (c) return `custom.${c}[${idx}]`;
    return null;
  }
  // {{<хувьсагчийн нэр>[2]}}
  const idxd = name.match(/^(.+?)\s*\[\s*(\d+)\s*\]$/);
  if (idxd) {
    const c = customByLabel(customs, idxd[1]);
    return c ? `custom.${c}[${idxd[2]}]` : null;
  }
  const c = customByLabel(customs, name);
  return c ? `custom.${c}` : null;
}

// Текст доторх бүх {{Монгол нэр}}-ийг {{дотоод token}} болгоно.
export function applyTokenAliases(content: string, customs: CustomTokenName[] = []): string {
  if (!content || !content.includes('{{')) return content;
  return content.replace(/\{\{([^{}\n]+)\}\}/g, (m, inner) => {
    const key = tokenNameToKey(inner, customs);
    return key ? `{{${key}}}` : m;
  });
}

// Studio UI: дотоод key → оруулах Монгол нэр (байхгүй бол null).
export function keyToTokenName(key: string, customs: CustomTokenName[] = []): string | null {
  const b = BUILTIN_TOKEN_NAMES.find((t) => t.key === key);
  if (b) return b.name;
  const m = key.match(/^custom\.(\w+)$/);
  if (m) {
    const c = (customs || []).find((x) => x.key === m[1]);
    const label = c?.label?.trim();
    // Нэр нь буцаад яг энэ хувьсагч руу хөрвөх ёстой (давхцал/хориотой тэмдэгтгүй).
    if (label && tokenNameToKey(label, customs) === key) return label;
  }
  return null;
}

// Хэрэглэгчийн хувьсагчийн харагдах нэр ашиглаж болох эсэх — асуудалтай бол шалтгаан.
export function customLabelProblem(
  label: string,
  key: string,
  customs: CustomTokenName[] = [],
): string | null {
  const l = (label || '').trim();
  if (!l) return null;
  if (/[{}\[\]]/.test(l)) return 'Нэрэнд { } [ ] тэмдэгт байж болохгүй';
  if (BUILTIN_BY_NAME.has(norm(l))) return `'${l}' нь үндсэн талбарын нэртэй давхцаж байна`;
  if (CATEGORY_BY_NAME.has(norm(l))) return `'${l}' нэрийг бүлгийн талбар ашигладаг`;
  if (ASCII_KEY_RE.test(l) && (l.includes('.') || l.includes('['))) return 'Латин нэрэнд цэг/хаалт байж болохгүй';
  const dup = (customs || []).find((c) => c.key !== key && c.label && norm(c.label) === norm(l));
  if (dup) return `'${l}' нэр өөр хувьсагчид (${dup.key}) ашиглагдсан байна`;
  return null;
}
