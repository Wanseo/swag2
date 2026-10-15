import './style.css'
import mintPlayer from './assets/mint-player.png'

const moods = {
  daydream: { label: 'Daydream', note: '몽환적인 오후, 느리게 번지는 색', colors: ['#e7e5d7', '#81b5c0', '#e7a4a8', '#326f7c'], speed: 0.13 },
  warmth: { label: 'Warmth', note: '따뜻한 리듬, 햇빛에 물든 공기', colors: ['#eee5cf', '#e9b77d', '#d88770', '#96b3b4'], speed: 0.18 },
  drift: { label: 'Drift', note: '차분한 호흡, 깊고 푸른 잔향', colors: ['#dde6d8', '#86a99a', '#6ca8be', '#194c58'], speed: 0.1 },
  afterglow: { label: 'Afterglow', note: '밤의 여운, 부드럽게 남는 온기', colors: ['#ddd4df', '#ac9dc4', '#e7a2ab', '#676b94'], speed: 0.16 },
} as const

type Mood = keyof typeof moods
let mood: Mood = 'daydream'
let paused = false
let stream: MediaStream | undefined

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="atmosphere" aria-hidden="true"></canvas>
  <div class="grain" aria-hidden="true"></div>
  <main class="experience">
    <header><a class="wordmark" href="./" aria-label="moodroom 홈">moodroom<span>®</span></a><span class="edition">SOUND INTO COLOUR · VOL. 001</span><button id="motion" class="text-button" aria-pressed="false">움직임 멈추기 <span>Ⅱ</span></button></header>
    <section class="stage" aria-label="음악의 분위기를 담는 공간">
      <figure class="player-foreground">
        <img src="${mintPlayer}" alt="잔기스가 남은 민트색 빈티지 MP3 플레이어와 분홍색 유선 이어폰" width="1024" height="1536" fetchpriority="high" draggable="false" />
      </figure>
      <div class="stage-caption"><span class="tiny-label">A SPACE TO FEEL</span><h1>지금, 어떤 색의 기분인가요.</h1></div>
      <div class="portrait" id="portrait">
        <div class="portrait-halo" aria-hidden="true"></div>
        <video id="camera" autoplay playsinline muted hidden></video>
        <div class="camera-placeholder"><svg viewBox="0 0 120 160" fill="none" aria-hidden="true"><ellipse cx="60" cy="46" rx="23" ry="29"/><path d="M13 151v-20c0-28 18-45 47-45s47 17 47 45v20"/></svg><span>YOUR PRESENCE, HERE</span></div>
      </div>
      <div class="camera-controls"><button id="camera-toggle" class="camera-button"><span class="camera-icon" aria-hidden="true">＋</span> 카메라 켜기</button><p id="camera-status" role="status">당신의 모습을 이 공간에 담아보세요</p></div>
    </section>
    <footer><div class="mood-info"><span class="tiny-label"><i></i> COLOUR STUDY / <span id="mood-number">01</span></span><h2 id="mood-title">Daydream</h2><p id="mood-note">${moods.daydream.note}</p></div><div class="palette-control"><span class="tiny-label">CHOOSE YOUR ATMOSPHERE</span><div class="mood-options" role="group" aria-label="분위기 선택">${Object.entries(moods).map(([key, value], i) => `<button class="mood-button" data-mood="${key}" aria-pressed="${i === 0}" aria-label="${value.label}"><span class="swatch" style="background:linear-gradient(135deg, ${value.colors[1]}, ${value.colors[2]}, ${value.colors[3]})"></span><span>${value.label}</span></button>`).join('')}</div></div><div class="connection"><span class="connection-icon">≋</span><span>음악이 색이 되는 순간<small>Spotify 연결 예정 · 지금은 분위기 미리보기</small></span></div></footer>
  </main>`

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
  motionButton.innerHTML = paused ? '움직임 재생 <span>▷</span>' : '움직임 멈추기 <span>Ⅱ</span>'
}
paused = reducedMotion.matches
updateMotion()
motionButton.addEventListener('click', () => { paused = !paused; updateMotion() })
reducedMotion.addEventListener('change', event => { paused = event.matches; updateMotion() })

const cameraButton = document.querySelector<HTMLButtonElement>('#camera-toggle')!
const video = document.querySelector<HTMLVideoElement>('#camera')!
const cameraStatus = document.querySelector('#camera-status')!
function stopCamera() {
  stream?.getTracks().forEach(track => track.stop())
  stream = undefined
  video.srcObject = null
  video.hidden = true
  document.querySelector('#portrait')!.classList.remove('camera-active')
  cameraButton.innerHTML = '<span class="camera-icon" aria-hidden="true">＋</span> 카메라 켜기'
  cameraStatus.textContent = '당신의 모습을 이 공간에 담아보세요'
}
cameraButton.addEventListener('click', async () => {
  if (stream) { stopCamera(); return }
  cameraButton.disabled = true
  cameraStatus.textContent = '카메라 연결을 기다리고 있어요'
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } }, audio: false })
    video.srcObject = stream
    video.hidden = false
    await video.play()
    document.querySelector('#portrait')!.classList.add('camera-active')
    cameraButton.textContent = '카메라 끄기'
    cameraStatus.textContent = '카메라 미리보기 · 영상은 서버로 전송되지 않아요'
  } catch (error) {
    stopCamera()
    cameraStatus.textContent = error instanceof DOMException && error.name === 'NotAllowedError' ? '카메라 권한을 허용한 뒤 다시 눌러주세요' : '카메라를 연결할 수 없어요. 장치와 HTTPS 연결을 확인해주세요'
  } finally { cameraButton.disabled = false }
})
window.addEventListener('pagehide', stopCamera)

// Layered domain warping makes colour boundaries stretch and curl like liquid.
// The small render surface is softened by CSS; the grain stays on a separate layer.
const canvas = document.querySelector<HTMLCanvasElement>('#atmosphere')!
canvas.width = 240
canvas.height = 160
const ctx = canvas.getContext('2d', { alpha: false })!
const frame = ctx.createImageData(canvas.width, canvas.height)
const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
let colors = moods[mood].colors.map(rgb)
let time = 0
let last = 0
function draw(now: number) {
  requestAnimationFrame(draw)
  if (now - last < 1000 / 30 || document.hidden) return
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now
  if (!paused) time += delta * moods[mood].speed * 3
  const target = moods[mood].colors.map(rgb)
  colors = colors.map((color, i) => color.map((channel, j) => channel + (target[i]![j]! - channel) * 0.065))
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width, v = y / canvas.height
      const driftX = Math.sin(v * 4.5 + time * 0.85) * 0.23
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
      const lightX = 0.5 + Math.sin(time * 0.45) * 0.06
      const lightY = 0.4 + Math.cos(time * 0.4) * 0.05
      const centerLight = Math.exp(-((u - lightX) ** 2 * 9 + (v - lightY) ** 2 * 6)) * 0.52
      const topLight = Math.max(0, 1 - v * 2.5) * 0.55
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
}
requestAnimationFrame(draw)
