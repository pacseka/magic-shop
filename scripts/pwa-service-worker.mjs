import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function pwaServiceWorker() {
  let config;
  return {
    name: 'pwa-service-worker',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    writeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const files = [];
      function collect(dir, prefix = '') {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const relative = path.posix.join(prefix, entry.name);
          if (entry.isDirectory()) collect(path.join(dir, entry.name), relative);
          else if (entry.isFile() && relative !== 'sw.js') files.push(relative);
        }
      }
      collect(outDir);
      files.sort();

      const hash = createHash('sha256');
      for (const file of files) {
        hash.update(file);
        hash.update(readFileSync(path.join(outDir, file)));
      }
      const cacheName = `hacsi-magic-shops-${hash.digest('hex').slice(0, 12)}`;
      const urls = files.map((file) => `${config.base}${file}`);
      const source = `const CACHE = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(urls)};
const APP_URL = ${JSON.stringify(config.base)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('hacsi-magic-shops-') && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(APP_URL)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) return response;
      return caches.match(APP_URL + 'index.html').then((cached) => cached || response);
    }).catch(() => caches.match(APP_URL + 'index.html')));
    return;
  }

  if (!['script', 'style', 'image', 'font', 'manifest'].includes(request.destination)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  })));
});
`;
      writeFileSync(path.join(outDir, 'sw.js'), source);
    },
  };
}
