import { initializePreviews } from './previews'
import { readAudioPulse } from './audio-pulse'
import { createRippleGeometry, createRippleFronts, sampleRipples, type BassRipple } from './ripples'
import { moods, trackAtmospheres, type Mood } from './atmospheres'

let mood: Mood = 'daydream'
let paused = false

/** Track changes select a curated reference-inspired palette. */
export function setMood(next: Mood) {
  mood = next
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
paused = reducedMotion.matches
reducedMotion.addEventListener('change', event => { paused = event.matches })

function startAtmosphere() {
  // Layered domain warping makes colour boundaries stretch and curl like liquid.
  // The small render surface is softened by CSS; the grain stays on a separate layer.
  const canvas = document.querySelector<HTMLCanvasElement>('#atmosphere')!
  canvas.width = 160
  canvas.height = 108
  const ctx = canvas.getContext('2d', { alpha: false })!
  const frame = ctx.createImageData(canvas.width, canvas.height)
  const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
  const palettes = Object.fromEntries(Object.entries(moods).map(([key, value]) => [key, value.colors.map(rgb)]))
  let colors = palettes[mood]!.map(color => [...color])
  let lastDrawnMood: Mood | undefined
  const horizontalLight = new Float32Array(canvas.width)
  let geometry: ReturnType<typeof createRippleGeometry>
  function updateDistances() {
    const bounds = canvas.getBoundingClientRect()
    geometry = createRippleGeometry(canvas.width, canvas.height, bounds.width / bounds.height,
      (window.innerWidth * 0.5 - bounds.left) / bounds.width,
      (window.innerHeight * 0.5 - bounds.top) / bounds.height)
  }
  updateDistances()
  window.addEventListener('resize', updateDistances, { passive: true })
  window.addEventListener('atmosphere-scroll', updateDistances)
  let ripples: BassRipple[] = []
  let beatNumber = 0
  let time = 0
  let last = 0
  function draw(now: number) {
    requestAnimationFrame(draw)
    if (now - last < 1000 / 30 || document.hidden) return
    const delta = Math.min((now - last) / 1000, 0.1)
    last = now
    const pulse = paused ? { energy: 0, beat: 0 } : readAudioPulse(now)
    if (paused) ripples = []
    ripples = ripples.filter(ripple => now - ripple.started < 2400)
    if (pulse.beat) {
      ripples.push({ started: now, strength: pulse.beat, seed: ++beatNumber })
      if (ripples.length > 3) ripples.shift()
    }
    const fronts = createRippleFronts(ripples, now)
    if (!paused) time += delta * moods[mood].speed * 2.25
    const target = palettes[mood]!
    const transitioning = colors.some((color, i) => color.some((channel, j) => Math.abs(channel - target[i]![j]!) > 0.1))
    if (paused && lastDrawnMood === mood && !transitioning) return
    colors = colors.map((color, i) => color.map((channel, j) => channel + (target[i]![j]! - channel) * 0.065))
    const lightX = 0.5 + Math.sin(time * 0.45) * 0.06
    const lightY = 0.4 + Math.cos(time * 0.4) * 0.05
    for (let x = 0; x < canvas.width; x++) {
      horizontalLight[x] = Math.exp(-((x / canvas.width - lightX) ** 2 * 9))
    }
    for (let y = 0; y < canvas.height; y++) {
      const v = y / canvas.height
      const verticalLight = Math.exp(-((v - lightY) ** 2 * 6)) * 0.52
      const topLight = Math.max(0, 1 - v * 2.5) * 0.55
      const rowDrift = Math.sin(v * 4.5 + time * 0.85) * 0.23
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width
        const driftX = rowDrift
          + Math.cos(u * 3.2 - v * 2.4 + time * 0.55) * 0.12
        const driftY = Math.cos(u * 4.1 - time * 0.7) * 0.2
          + Math.sin(v * 3.8 + u * 2.1 + time * 0.65) * 0.13
        const flowX = u + driftX
        const flowY = v + driftY
        const curl = Math.sin(flowX * 4.6 + flowY * 3.2 - time * 0.6) * 0.8
        const i = y * canvas.width + x
        const rippleShift = sampleRipples(i, geometry, fronts)
        const breathing = pulse.energy * (
          Math.sin(flowX * 6 + flowY * 4 - time) * 0.24
          + geometry.sin3[i]! * Math.sin(geometry.radius[i]! * 9 - time * 0.7) * 0.18)
        const wave = (Math.sin(flowY * 7 + flowX * 2.6 + curl + time * 0.75 + rippleShift + breathing) + 1) / 2
        const position = wave * 2.999
        const index = Math.floor(position)
        let blend = position - index
        blend = blend * blend * (3 - 2 * blend)
        const centerLight = horizontalLight[x]! * verticalLight
        const light = Math.max(centerLight, topLight)
        const offset = (y * canvas.width + x) * 4
        for (let c = 0; c < 3; c++) {
          const value = colors[index]![c]! * (1 - blend) + colors[Math.min(index + 1, 3)]![c]! * blend
          frame.data[offset + c] = value * (1 - light) + colors[0]![c]! * light
        }
        frame.data[offset + 3] = 255
      }
    }
    ctx.putImageData(frame, 0, 0)
    lastDrawnMood = mood
  }
  requestAnimationFrame(draw)
}

requestAnimationFrame(() => requestAnimationFrame(startAtmosphere))

initializePreviews(title => setMood(trackAtmospheres[title] ?? 'daydream'))

// Move the oversized continuous field without changing the fixed player or logo.
let scrollFrame = 0
function updateBackgroundScroll() {
  scrollFrame = 0
  document.documentElement.style.setProperty('--background-scroll', `${-window.scrollY * 0.65}px`)
  window.dispatchEvent(new Event('atmosphere-scroll'))
}
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateBackgroundScroll)
}, { passive: true })
window.addEventListener('pageshow', updateBackgroundScroll)
updateBackgroundScroll()
