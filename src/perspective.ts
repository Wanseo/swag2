/** Trackpad pinch changes the viewpoint with a broad range and smooth settling. */
export function initializePerspective() {
  if (window.matchMedia('(pointer: coarse)').matches) {
    // Mobile gestures must never drive the desktop camera zoom.
    for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
      window.addEventListener(name, event => event.preventDefault(), { passive: false })
    }
    let lastBackgroundTap = -1000
    window.addEventListener('touchend', event => {
      if ((event.target as Element).closest('button, a, [role="listbox"]')) return
      const now = performance.now()
      if (now - lastBackgroundTap < 350) event.preventDefault()
      lastBackgroundTap = now
    }, { passive: false })
    window.addEventListener('dblclick', event => {
      if (!(event.target as Element).closest('button, a, [role="listbox"]')) event.preventDefault()
    })
    return
  }
  let zoom = 1
  let targetZoom = 1
  let gestureStartZoom = 1
  let frame = 0
  let lastFrame = 0

  function render(now: number) {
    const elapsed = lastFrame ? Math.min(now - lastFrame, 64) : 16.7
    lastFrame = now
    zoom += (targetZoom - zoom) * (1 - Math.exp(-elapsed / 85))
    const settled = Math.abs(targetZoom - zoom) < 0.0005
    if (settled) zoom = targetZoom
    document.documentElement.style.setProperty('--view-zoom', String(zoom))
    window.dispatchEvent(new Event('atmosphere-scroll'))
    if (!settled) frame = requestAnimationFrame(render)
    else { frame = 0; lastFrame = 0 }
  }

  const applyZoom = (next: number) => {
    targetZoom = Math.max(0.55, Math.min(1.65, next))
    if (!frame) frame = requestAnimationFrame(render)
  }
  window.addEventListener('wheel', event => {
    if (!event.ctrlKey || event.metaKey) return
    event.preventDefault()
    applyZoom(targetZoom * Math.exp(-event.deltaY * 0.012))
  }, { passive: false })

  // Safari exposes trackpad pinches as GestureEvents rather than ctrl+wheel.
  window.addEventListener('gesturestart', event => {
    event.preventDefault()
    gestureStartZoom = targetZoom
  }, { passive: false })
  window.addEventListener('gesturechange', event => {
    const scale = (event as Event & { scale?: number }).scale
    if (!scale || !Number.isFinite(scale)) return
    event.preventDefault()
    applyZoom(gestureStartZoom * scale ** 1.25)
  }, { passive: false })
  window.addEventListener('gestureend', event => event.preventDefault(), { passive: false })
}
