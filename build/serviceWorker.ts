import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { Plugin } from 'vite'

/** Wszystkie pliki z `public/` (ścieżki względne, z `/`). */
function publicFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      if (statSync(full).isDirectory()) walk(full)
      else out.push(relative(dir, full).replaceAll('\\', '/'))
    }
  }
  walk(dir)
  return out
}

/**
 * Kod service workera. Pliki aplikacji trafiają do pamięci podręcznej przy instalacji; nawigacja idzie najpierw
 * do sieci (świeża wersja), a bez sieci — z pamięci. Nowa wersja (inna lista plików lub treść) instaluje się
 * w tle, przejmuje stronę i usuwa stare pliki; aplikacja pokazuje wtedy prośbę o odświeżenie.
 */
function workerSource(version: string, files: string[]): string {
  return `// Wygenerowane przy buildzie (build/serviceWorker.ts) — nie edytuj ręcznie.
const CACHE = 'erudyta-${version}'
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)])}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('erudyta-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('./', copy))
          return response
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('./index.html'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
`
}

/** Plugin Vite: przy `vite build` dopisuje `sw.js` z listą wszystkich plików aplikacji i wersją z ich skrótu. */
export function serviceWorker(): Plugin {
  let publicDir = ''
  return {
    name: 'erudyta-service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir
    },
    generateBundle(_options, bundle) {
      const hash = createHash('sha256')
      const fromBundle = Object.keys(bundle).sort()
      for (const name of fromBundle) {
        const item = bundle[name]
        if (!item) continue
        hash.update(name)
        hash.update(item.type === 'chunk' ? item.code : item.source)
      }
      const fromPublic = publicDir ? publicFiles(publicDir).sort() : []
      for (const name of fromPublic) {
        hash.update(name)
        hash.update(readFileSync(join(publicDir, name)))
      }
      // Fonty dla innych alfabetów przeglądarka pobiera tylko w razie potrzeby — nie zajmują miejsca z góry.
      const files = [...new Set([...fromBundle, ...fromPublic])].filter(
        (f) => f !== 'sw.js' && !f.endsWith('.map') && !/-(cyrillic|greek|vietnamese)/.test(f),
      )
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: workerSource(hash.digest('hex').slice(0, 12), files) })
    },
  }
}
