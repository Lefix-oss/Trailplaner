// Lädt die DOM-freien Skriptblöcke aus index.html in einen gemeinsamen Node-Kontext
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function block(marker) {
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`Skriptblock nicht gefunden: ${marker}`);
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

const ctx = vm.createContext({ console });
function run(marker) {
  const module = { exports: {} };
  ctx.module = module;
  vm.runInContext(block(marker), ctx, { filename: marker });
  // Objekte aus dem vm-Kontext haben fremde Prototypen; für deepEqual in die Node-Welt kopieren
  const api = {};
  for (const [k, v] of Object.entries(module.exports)) {
    api[k] = typeof v !== 'function' ? v : (...args) => {
      const r = v(...args);
      return r && typeof r === 'object' ? structuredClone(r) : r;
    };
  }
  return api;
}

export const Planner = run('/* Trailplaner – Planungslogik');
export const Pruefung = run('/* Trailplaner – Prüfungslogik');
