/** Trackpad pinch controls the scene's viewpoint, independent of button presses. */
export function initializePerspective() {
  let zoom = 1
  let gestureStartZoom = 1
  let frame = 0
  const applyZoom = (next: number) => {
    zoom = Math.max(0.85, Math.min(1.2, next))
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      document.documentElement.style.setProperty('--view-zoom', String(zoom))
      window.dispatchEvent(new Event('atmosphere-scroll'))
    })
  }
  window.addEventListener('wheel', event => {
    if (!event.ctrlKey || event.metaKey) return
    event.preventDefault()
    applyZoom(zoom * Math.exp(-event.deltaY * 0.004))
  }, { passive: false })

  // Safari exposes trackpad pinches as GestureEvents rather than ctrl+wheel.
  window.addEventListener('gesturestart', event => {
    event.preventDefault()
    gestureStartZoom = zoom
  }, { passive: false })
  window.addEventListener('gesturechange', event => {
    const scale = (event as Event & { scale?: number }).scale
    if (!scale || !Number.isFinite(scale)) return
    event.preventDefault()
    applyZoom(gestureStartZoom * scale)
  }, { passive: false })
  window.addEventListener('gestureend', event => event.preventDefault(), { passive: false })
}
