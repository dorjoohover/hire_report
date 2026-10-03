/**
 * Studio-гийн upload хийсэн зураг (pdf-template/image/<key>) — хадгалсан URL өөр орчны
 * хосттой (жиш: test-ийн "hire-core-1") үед ЭНЭ орчны core-оос key-ээр уншина.
 *
 *   npx ts-node --transpile-only -r tsconfig-paths/register -r ./test/stub-native.js test/uploaded-image-url.spec-lite.ts
 */
import axios from 'axios';
import { DynamicTemplateRenderer, coreApiBase } from '../src/pdf/dynamic-template.renderer';

let failed = 0;
const check = (name: string, actual: any, expected: any) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${name}  →  ${JSON.stringify(actual)}${ok ? '' : `  (хүлээсэн: ${JSON.stringify(expected)})`}`);
};

(async () => {
  check('B1 CORE ("…/") → …/api/v1/', coreApiBase({ CORE: 'https://api.hire.mn/' } as any), 'https://api.hire.mn/api/v1/');
  check('B2 CORE "/"-гүй', coreApiBase({ CORE: 'http://core:5000' } as any), 'http://core:5000/api/v1/');
  check('B3 CORE_API_URL давуу', coreApiBase({ CORE: 'http://x/', CORE_API_URL: 'http://y/api/v1' } as any), 'http://y/api/v1/');
  check('B4 аль нь ч байхгүй → null', coreApiBase({} as any), null);

  const r: any = Object.create(DynamicTemplateRenderer.prototype);
  const calls: string[] = [];
  let failHosts: string[] = [];
  (axios as any).get = async (u: string) => {
    calls.push(u);
    if (failHosts.some((h) => u.includes(h))) throw new Error('getaddrinfo EAI_AGAIN');
    return { data: Buffer.from('IMG:' + u) };
  };
  const saved = { ...process.env };
  const testUrl = 'http://hire-core-1:5000/api/v1/pdf-template/image/pt_1790607712501_unnamed%20(2).png';

  process.env.CORE = 'https://api.hire.mn/';
  delete process.env.CORE_API_URL;
  failHosts = ['hire-core-1'];
  calls.length = 0;
  const buf = await r.loadUploadedImage(testUrl);
  check('I1 test-ийн хост → prod-ийн core-оос key-ээр (хуучин хост руу огт явахгүй)', [calls, buf.toString().startsWith('IMG:https://api.hire.mn/')], [
    ['https://api.hire.mn/api/v1/pdf-template/image/pt_1790607712501_unnamed%20(2).png'],
    true,
  ]);

  failHosts = ['api.hire.mn'];
  calls.length = 0;
  await r.loadUploadedImage(testUrl);
  check('I2 өөрийн core унавал хадгалсан URL-аар', calls, [
    'https://api.hire.mn/api/v1/pdf-template/image/pt_1790607712501_unnamed%20(2).png',
    testUrl,
  ]);

  delete process.env.CORE;
  failHosts = [];
  calls.length = 0;
  await r.loadUploadedImage('https://cdn.example.com/x.png');
  check('I3 pdf-template биш URL, CORE-гүй → шууд', calls, ['https://cdn.example.com/x.png']);

  process.env = saved;
  if (failed) {
    console.log(`\n❌ ${failed} шалгалт унасан`);
    process.exit(1);
  }
  console.log('\n✅ БҮГД АМЖИЛТТАЙ');
})();
