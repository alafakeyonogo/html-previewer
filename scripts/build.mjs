import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'editor.js', 'image-transform.js', 'example.js', 'icons.svg', '示例.html', 'vendor', 'THIRD_PARTY_NOTICES.md']) {
  await cp(resolve(root, file), resolve(dist, file), { recursive: true });
}
console.log('Built static editor → dist/');
