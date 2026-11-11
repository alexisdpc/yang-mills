import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const extractIds = html => [...html.matchAll(/\sid\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)].map(match => match[1] || match[2]);
const extractEquations = text => [...text.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)].map(match => match[1] || match[2]);
function decodeHtmlMath(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", AMP: '&', LT: '<', GT: '>', QUOT: '"' };
  // Decode once, as HTML parsing does: &amp;lt; must remain the literal &lt;.
  return text.replace(/&(#(?:[xX][0-9a-fA-F]+|\d+)|amp|lt|gt|quot|apos|AMP|LT|GT|QUOT);/g, (_entity, value) => {
    if (value[0] !== '#') return named[value];
    const hex = value[1].toLowerCase() === 'x';
    const codePoint = Number.parseInt(value.slice(hex ? 2 : 1), hex ? 16 : 10);
    if (!codePoint || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return '\ufffd';
    return String.fromCodePoint(codePoint);
  });
}
assert(decodeHtmlMath('&amp; &lt; &gt; &quot; &apos; &#916; &#x394; &amp;lt;') === '& < > " \' Δ Δ &lt;',
  'HTML math must decode named and numeric entities exactly once');
const pages = readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
  .map(entry => {
    const html = readFileSync(resolve(root, entry.name), 'utf8');
    return { name: entry.name, html, ids: extractIds(html), equations: extractEquations(html).map(decodeHtmlMath) };
  });
assert(pages.some(page => page.name === 'index.html'), 'Missing index.html');
const pageIds = new Map(pages.map(page => [resolve(root, page.name), page.ids]));
const cssPaths = new Set(['assets/styles.css', 'assets/vendor/katex/katex.min.css'].map(path => resolve(root, path)));
const mathScripts = [
  'assets/vendor/katex/katex.min.js',
  'assets/vendor/katex/contrib/auto-render.min.js',
  'assets/math.js',
];
for (const page of pages) {
  const scriptTags = [...page.html.matchAll(/<script\b[^>]*>/gi)].map(match => new Map(
    [...match[0].matchAll(/\s([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
      .map(attribute => [attribute[1].toLowerCase(), attribute[2] ?? attribute[3] ?? attribute[4] ?? '']),
  ));
  if (page.equations.length || scriptTags.some(attributes => attributes.get('src') === 'assets/math.js')) {
    const mathIndexes = mathScripts.map(path => scriptTags.findIndex(attributes => attributes.get('src') === path));
    assert(mathIndexes.every((position, i) => position >= 0 && (i === 0 || position > mathIndexes[i - 1])), `${page.name}: math dependencies must load in order`);
    mathIndexes.forEach(position => {
      const attributes = scriptTags[position];
      assert(attributes?.has('defer') && !attributes.has('async')
        && ['', 'text/javascript', 'application/javascript'].includes((attributes.get('type') || '').toLowerCase()),
      `${page.name}: math startup must use ordered classic deferred scripts`);
    });
  }
  assert(new Set(page.ids).size === page.ids.length, `${page.name}: duplicate HTML IDs`);
  for (const match of page.html.matchAll(/\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const url = match[1] ?? match[2];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) continue;
    try {
      const target = new URL(url, `https://local.invalid/${page.name}`);
      const pathname = decodeURIComponent(target.pathname);
      const localPath = resolve(root, pathname.slice(1));
      const exists = existsSync(localPath);
      assert(exists, `${page.name}: missing local asset: ${url}`);
      if (!exists) continue;
      if (extname(localPath) === '.css') cssPaths.add(localPath);
      if (target.hash && extname(localPath) === '.html') {
        const targetIds = pageIds.get(localPath) ?? extractIds(readFileSync(localPath, 'utf8'));
        assert(targetIds.includes(decodeURIComponent(target.hash.slice(1))), `${page.name}: missing anchor: ${url}`);
      }
    } catch (error) {
      failures.push(`${page.name}: invalid local link ${url}: ${error.message}`);
    }
  }
}
for (const ref of JSON.parse(readFileSync(resolve(root, 'assets/references.json'), 'utf8'))) {
  assert(existsSync(resolve(root, decodeURIComponent(ref.localPath))), `Missing reference: ${ref.localPath}`);
  for (const key of ['id', 'title', 'authors', 'year', 'description', 'readingHint']) assert(Boolean(ref[key]), `Reference missing ${key}`);
}
for (const fullPath of cssPaths) {
  const css = readFileSync(fullPath, 'utf8');
  for (const [, raw] of css.matchAll(/url\(([^)]+)\)/g)) {
    const url = raw.replace(/^['"]|['"]$/g, '');
    if (!/^(data:|https?:)/.test(url)) assert(existsSync(resolve(dirname(fullPath), url)), `Missing font/image: ${url}`);
  }
}
const katexModule = { exports: {} };
vm.runInNewContext(readFileSync(resolve(root, 'assets/vendor/katex/katex.min.js'), 'utf8'), { module: katexModule, exports: katexModule.exports, console });
const equations = pages.flatMap(page => page.equations.map(equation => ({ source: page.name, equation })));
const app = readFileSync(resolve(root, 'assets/app.js'), 'utf8');
equations.push(...[...app.matchAll(/equation: String\.raw`([^`]+)`/g)].map(match => ({ source: 'assets/app.js', equation: match[1] })));
for (const { source, equation } of equations) {
  try { katexModule.exports.renderToString(equation, { throwOnError: true, strict: 'error' }); }
  catch (error) { failures.push(`${source}: invalid equation: ${error.message}`); }
}

// Execute the real classic bootstrap without the app module. These checks cover
// the lifecycle that previously left raw LaTeX visible after startup failures.
const mathSource = readFileSync(resolve(root, 'assets/math.js'), 'utf8');
function mathStartup({ readyState = 'complete', rendererAvailable = true } = {}) {
  const document = Object.assign(new EventTarget(), {
    readyState, body: readyState === 'loading' ? null : { id: 'body' },
    documentElement: { dataset: {} },
  });
  const dependencies = [new EventTarget(), new EventTarget()];
  document.querySelectorAll = () => dependencies;
  const window = new EventTarget();
  const calls = [];
  const errors = [];
  const installRenderer = () => { window.renderMathInElement = (element, options) => calls.push({ element, options }); };
  if (rendererAvailable) installRenderer();
  vm.runInNewContext(mathSource, { window, document, console: { error: message => errors.push(message) } }, { filename: 'assets/math.js', timeout: 1000 });
  return { window, document, dependencies, calls, errors, installRenderer };
}
try {
  const ready = mathStartup();
  assert(ready.calls.length === 1 && ready.calls[0].element === ready.document.body,
    'Static math must render without loading the interactive app');
  assert(ready.document.documentElement.dataset.mathStatus === 'ready', 'Successful startup must report ready');
  const dynamicRoot = { id: 'route-equation' };
  assert(ready.window.YangMillsMath.typeset(dynamicRoot) === true && ready.calls.at(-1).element === dynamicRoot,
    'Updated route equations must render through the shared math entry point');

  const loading = mathStartup({ readyState: 'loading' });
  assert(loading.calls.length === 0, 'Math must wait while the document body is unavailable');
  loading.document.body = { id: 'body' };
  loading.document.readyState = 'interactive';
  loading.document.dispatchEvent(new Event('DOMContentLoaded'));
  assert(loading.calls.length === 1 && loading.calls[0].element === loading.document.body,
    'Math must render when the DOM becomes ready');

  const delayed = mathStartup({ rendererAvailable: false });
  assert(delayed.document.documentElement.dataset.mathStatus === 'unavailable' && delayed.errors.length === 1,
    'Missing math dependencies must be reported instead of silently skipped');
  delayed.installRenderer();
  delayed.dependencies[1].dispatchEvent(new Event('load'));
  assert(delayed.calls.length === 1 && delayed.calls[0].element === delayed.document.body
    && delayed.document.documentElement.dataset.mathStatus === 'ready',
  'Math must recover after a delayed renderer loads');
} catch (error) {
  failures.push(`Math startup regression: ${error.message}`);
}

for (const script of [
  ...readdirSync(resolve(root, 'assets')).filter(name => name.endsWith('.js')).map(name => `assets/${name}`),
  ...readdirSync(resolve(root, 'scripts')).filter(name => name.endsWith('.mjs')).map(name => `scripts/${name}`),
]) {
  try { execFileSync(process.execPath, ['--check', resolve(root, script)], { stdio: 'pipe' }); }
  catch (error) { failures.push(`Syntax error in ${script}: ${error.stderr}`); }
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Passed: ${pages.length} HTML pages, local links and cross-page anchors, reference metadata, font assets, ${equations.length} LaTeX expressions, independent math startup and recovery, and JavaScript syntax.`);
