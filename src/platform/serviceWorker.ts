/**
 * Rejestracja service workera (tylko w buildzie produkcyjnym — w `npm run dev` przeszkadzałby w odświeżaniu).
 * `onUpdate` dostaje znać, gdy nowa wersja aplikacji przejęła stronę i warto ją przeładować.
 */
export function registerServiceWorker(onUpdate: () => void): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  // Pierwsze przejęcie strony (świeża instalacja) to nie aktualizacja — wtedy nie ma czego odświeżać.
  // Każde kolejne, także w tej samej sesji, oznacza nową wersję.
  let controlled = navigator.serviceWorker.controller !== null
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) onUpdate()
    controlled = true
  })
  const register = () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Bez service workera aplikacja działa normalnie, tylko nie offline.
    })
  }
  // Po `load`, żeby instalacja nie konkurowała z pierwszym wczytaniem; efekt Reacta bywa wywołany już po nim.
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
