// spec-lite туршилтад: macOS-д build хийгдсэн native модулийг (canvas г.м.) Linux VM дээр
// ачаалж чадахгүй тул хоосон stub-аар орлуулна (PDF зурах хэсэгт хүрэхгүй тест).
const Module = require('module');
const orig = Module._load;
const stub = new Proxy(function () {}, { get: (_t, k) => (k === '__esModule' ? false : stub), apply: () => stub, construct: () => stub });
Module._load = function (req, ...rest) {
  if (/^(canvas|sharp|chartjs-node-canvas)(\/|$)/.test(req)) return stub;
  return orig.call(this, req, ...rest);
};
