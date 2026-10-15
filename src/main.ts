const moods = {
  daydream: { label: 'Daydream', note: '몽환적인 오후, 느리게 번지는 색', colors: ['#e7e5d7', '#81b5c0', '#e7a4a8', '#326f7c'], speed: 0.13 },
  warmth: { label: 'Warmth', note: '따뜻한 리듬, 햇빛에 물든 공기', colors: ['#eee5cf', '#e9b77d', '#d88770', '#96b3b4'], speed: 0.18 },
  drift: { label: 'Drift', note: '차분한 호흡, 깊고 푸른 잔향', colors: ['#dde6d8', '#86a99a', '#6ca8be', '#194c58'], speed: 0.1 },
  afterglow: { label: 'Afterglow', note: '밤의 여운, 부드럽게 남는 온기', colors: ['#ddd4df', '#ac9dc4', '#e7a2ab', '#676b94'], speed: 0.16 },
} as const

type Mood = keyof typeof moods
let mood: Mood = 'daydream'
let paused = false

/** Future Spotify integration can select a mood through this single entry point. */
export function setMood(next: Mood) {
  mood = next
  document.querySelector('#mood-title')!.textContent = moods[next].label
  document.querySelector('#mood-note')!.textContent = moods[next].note
  document.querySelector('#mood-number')!.textContent = String(Object.keys(moods).indexOf(next) + 1).padStart(2, '0')
  document.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mood === next)))
}

document.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(button => button.addEventListener('click', () => setMood(button.dataset.mood as Mood)))
const motionButton = document.querySelector<HTMLButtonElement>('#motion')!
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
function updateMotion() {
  motionButton.setAttribute('aria-pressed', String(paused))
  motionButton.setAttribute('aria-label', paused ? '움직임 재생' : '움직임 멈추기')
  motionButton.innerHTML = paused ? '<span aria-hidden="true">▷</span>' : '<span aria-hidden="true">Ⅱ</span>'
}
paused = reducedMotion.matches
updateMotion()
motionButton.addEventListener('click', () => { paused = !paused; updateMotion() })
reducedMotion.addEventListener('change', event => { paused = event.matches; updateMotion() })

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
  let time = 0
  let last = 0
  function draw(now: number) {
    requestAnimationFrame(draw)
    if (now - last < 1000 / 30 || document.hidden) return
    const delta = Math.min((now - last) / 1000, 0.1)
    last = now
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
        const wave = (Math.sin(flowY * 7 + flowX * 2.6 + curl + time * 0.75) + 1) / 2
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
