'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Barra de carga superior (azul eléctrico: se ve sobre la franja amarilla y sobre el header). Arranca al hacer clic en un enlace
 * interno o al enviar un formulario GET (buscador) y termina cuando cambia la URL.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const timer = useRef<number | null>(null)
  const url = `${pathname}?${searchParams}`
  const lastUrl = useRef(url)

  // Cuando la URL cambia, completamos la barra en cuanto ya no quedan esqueletos de carga en pantalla.
  useEffect(() => {
    if (lastUrl.current === url) return
    lastUrl.current = url
    let hide: number | undefined
    const finish = () => {
      observer.disconnect()
      window.clearTimeout(safety)
      if (timer.current) window.clearInterval(timer.current)
      setProgress(100)
      setState('done')
      hide = window.setTimeout(() => {
        setState('idle')
        setProgress(0)
      }, 450)
    }
    const check = () => {
      if (!document.querySelector('[data-skeleton]')) finish()
    }
    const observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    const safety = window.setTimeout(finish, 10000)
    const first = window.setTimeout(check, 0)
    return () => {
      observer.disconnect()
      window.clearTimeout(safety)
      window.clearTimeout(first)
      if (hide) window.clearTimeout(hide)
    }
  }, [url])

  useEffect(() => {
    const start = () => {
      if (timer.current) window.clearInterval(timer.current)
      setState('loading')
      setProgress(8)
      // Avanza rápido al principio y cada vez más lento, sin llegar al final.
      timer.current = window.setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.08))
      }, 200)
    }

    const isInternal = (href: URL) =>
      href.origin === window.location.origin &&
      href.pathname + href.search !== window.location.pathname + window.location.search

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      const target = new URL(anchor.href, window.location.href)
      if (isInternal(target)) start()
    }

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement
      if (form.method.toLowerCase() !== 'get' || !form.action) return
      if (new URL(form.action).origin === window.location.origin) start()
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="route-progress"
      data-state={state}
      style={{ transform: `scaleX(${progress / 100})` }}
    />
  )
}
