import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const base = process.argv.includes('--project-path') ? '/yang-mills' : '';
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.jpeg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base && pathname === base) { res.writeHead(302, { Location: `${base}/` }); res.end(); return; }
    if (base && !pathname.startsWith(`${base}/`)) throw new Error('Not found');
    pathname = pathname.slice(base.length).replace(/^\/+/, '') || 'index.html';
    if (pathname.includes('\\') || !(['index.html', 'technical.html'].includes(pathname) || pathname.startsWith('assets/') || pathname.startsWith('references/'))) throw new Error('Not found');
    const path = resolve(root, pathname);
    if (!path.startsWith(root + sep) || !(await stat(path)).isFile()) throw new Error('Not found');
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(path));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Yang–Mills field guide: http://127.0.0.1:${port}${base}/`));
