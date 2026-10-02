// ts-node --transpile-only -r tsconfig-paths/register test/result-type-default.spec-lite.ts
// Тайлангийн төрөлгүй (assessment.report = null) тест — result.type NOT NULL тул CORRECT (10).
import { ResultDao } from '../src/daos/result.dao';

let saved: any[] = [];
const repo = { create: (x: any) => ({ ...x, id: 1 }), save: async (x: any) => saved.push(x) };
const dao = new ResultDao({ getRepository: () => repo } as any);
(async () => {
  await dao.create({ code: 'C1', type: null, assessment: 144, point: 1316 } as any);
  await dao.create({ code: 'C2', type: 20, assessment: 1 } as any);
  const got = saved.map((s) => s.type);
  const ok = JSON.stringify(got) === JSON.stringify([10, 20]);
  console.log(ok ? '✅ result.type: null → 10, 20 хэвээр' : `❌ ${JSON.stringify(got)}`);
  process.exit(ok ? 0 : 1);
})();
