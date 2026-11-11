import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
for (const path of ['index.html', 'technical.html', '.nojekyll', 'assets', 'references']) await cp(resolve(root, path), resolve(output, path), { recursive: true });
console.log('Static website prepared in dist/.');
