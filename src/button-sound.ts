/** A short local sound, separate from music analysis so it cannot trigger bass waves. */
export function createButtonSound() {
  const click = new Audio(`${import.meta.env.BASE_URL}audio/button-click.wav`)
  click.preload = 'auto'
  click.volume = 1
  click.load()
  window.addEventListener('pagehide', () => click.pause())
  return () => {
    try {
      click.currentTime = 0
      void click.play().catch(() => {})
    } catch {
      // Button actions still work if sound is unavailable or blocked.
    }
  }
}
