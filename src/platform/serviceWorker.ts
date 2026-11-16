/**
 * Rejestracja service workera (tylko w buildzie produkcyjnym — w `npm run dev` przeszkadzałby w odświeżaniu).
 * `onUpdate` dostaje znać, gdy nowa wersja aplikacji przejęła stronę i warto ją przeładować.
 */
export function registerServiceWorker(onUpdate: () => void): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  // Strona bez kontrolera to pierwsza instalacja — wtedy nie ma czego odświeżać.
  const hadController = navigator.serviceWorker.controller !== null
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) onUpdate()
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
