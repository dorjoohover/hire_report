#!/usr/bin/env node
// `node --cpu-prof`-ийн .cpuprofile-ыг уншиж хаана CPU зарцуулсныг гаргана (deps-гүй).
// node scripts/analyze-cpuprofile.js <file.cpuprofile> [topN=40]
const fs = require('fs');
const file = process.argv[2];
const topN = Number(process.argv[3] || 40);
if (!file) { console.error('usage: analyze-cpuprofile.js <file.cpuprofile> [topN]'); process.exit(2); }
const p = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(p.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of p.nodes) for (const c of n.children || []) parent.set(c, n.id);
const selfUs = new Map();
for (let i = 0; i < p.samples.length; i++) {
  const id = p.samples[i];
  selfUs.set(id, (selfUs.get(id) || 0) + (p.timeDeltas[i] || 0));
}
const total = [...selfUs.values()].reduce((a, b) => a + b, 0);
const bucketOf = (url) => {
  if (!url) return '(native/gc/program)';
  const m = url.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (m) return m[1];
  const s = url.match(/\/(src\/.*|scripts\/.*)$/);
  if (s) return s[1];
  if (url.startsWith('node:')) return url;
  return url.split('/').slice(-2).join('/');
};
const fn = new Map(), bucket = new Map(), incl = new Map();
for (const [id, us] of selfUs) {
  const n = byId.get(id); const cf = n.callFrame;
  const key = `${cf.functionName || '(anonymous)'}  ${bucketOf(cf.url)}:${cf.lineNumber + 1}`;
  fn.set(key, (fn.get(key) || 0) + us);
  const b = bucketOf(cf.url);
  bucket.set(b, (bucket.get(b) || 0) + us);
  // inclusive: app кодын (src/) функц бүрд — дуудлагын стекийн дагуу
  const seen = new Set(); let cur = id;
  while (cur != null) {
    const c = byId.get(cur).callFrame;
    if (/\/src\//.test(c.url)) {
      const k = `${c.functionName || '(anonymous)'}  ${bucketOf(c.url)}:${c.lineNumber + 1}`;
      if (!seen.has(k)) { seen.add(k); incl.set(k, (incl.get(k) || 0) + us); }
    }
    cur = parent.get(cur);
  }
}
const pct = (us) => `${(us / 1000).toFixed(0).padStart(7)}ms ${((100 * us) / total).toFixed(1).padStart(5)}%`;
const show = (title, m, n) => {
  console.log(`\n== ${title} ==`);
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).forEach(([k, v]) => console.log(`${pct(v)}  ${k}`));
};
console.log(`profile: ${file}\nнийт sample хугацаа: ${(total / 1000).toFixed(0)}ms`);
show('Модуль/файлаар (self)', bucket, 25);
show('Функцээр (self)', fn, topN);
show('App код (src/) inclusive — дотор нь дуудсан бүх зүйлтэйгээ', incl, topN);
