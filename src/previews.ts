import album from './swag-ii.json'

export function initializePreviews() {
  const audio = new Audio()
  audio.preload = 'none'
  const screen = document.querySelector<HTMLDivElement>('#album-screen')!
  const artwork = document.querySelector<HTMLImageElement>('#album-art')!
  const title = document.querySelector('#track-title')!
  const position = document.querySelector('#track-position')!
  const info = document.querySelector<HTMLDivElement>('#preview-info')!
  const status = document.querySelector('#preview-status')!
  const toggle = document.querySelector<HTMLButtonElement>('#toggle-preview')!
  const link = document.querySelector<HTMLAnchorElement>('#itunes-link')!
  let selected = -1
  let version = 0
  let pending = false

  function updatePlaying(playing: boolean) {
    toggle.setAttribute('aria-pressed', String(playing))
    toggle.setAttribute('aria-label', playing ? '미리듣기 일시정지' : '미리듣기 재생')
    toggle.classList.toggle('is-playing', playing)
  }

  async function play() {
    const requestedVersion = version
    pending = true
    status.textContent = '미리듣기를 불러오는 중…'
    try {
      await audio.play()
    } catch (error) {
      if (requestedVersion !== version || (error instanceof DOMException && error.name === 'AbortError')) return
      status.textContent = error instanceof DOMException && error.name === 'NotAllowedError'
        ? '가운데 재생 버튼을 다시 눌러주세요'
        : '미리듣기를 불러올 수 없어요. 다른 곡을 선택하거나 iTunes에서 확인해주세요.'
      updatePlaying(false)
    } finally {
      if (requestedVersion === version) pending = false
    }
  }

  function select(index: number, resume: boolean) {
    version++
    pending = false
    audio.pause()
    selected = (index + album.tracks.length) % album.tracks.length
    const track = album.tracks[selected]!
    audio.src = track.preview
    if (!artwork.hasAttribute('src')) artwork.src = album.artwork
    title.textContent = track.title
    position.textContent = `SWAG II · ${String(selected + 1).padStart(2, '0')} / ${album.tracks.length}`
    const storeUrl = new URL(track.url)
    storeUrl.searchParams.set('app', 'itunes')
    link.href = storeUrl.href
    screen.hidden = false
    info.hidden = false
    status.textContent = 'Justin Bieber · SWAG II 미리듣기'
    updatePlaying(false)
    if (resume) void play()
  }

  toggle.addEventListener('click', () => {
    if (selected < 0) { select(0, true); return }
    if (!audio.paused || pending) {
      version++
      pending = false
      audio.pause()
      updatePlaying(false)
      status.textContent = '미리듣기 일시정지'
    } else {
      if (audio.ended) audio.currentTime = 0
      void play()
    }
  })
  document.querySelector('#next-track')!.addEventListener('click', () => select(selected < 0 ? 0 : selected + 1, !audio.paused || pending))
  document.querySelector('#previous-track')!.addEventListener('click', () => select(selected < 0 ? album.tracks.length - 1 : selected - 1, !audio.paused || pending))
  audio.addEventListener('playing', () => {
    updatePlaying(true)
    status.textContent = 'Justin Bieber · SWAG II 미리듣기 재생 중'
  })
  audio.addEventListener('waiting', () => { status.textContent = '미리듣기를 불러오는 중…' })
  audio.addEventListener('pause', () => updatePlaying(false))
  audio.addEventListener('ended', () => {
    updatePlaying(false)
    status.textContent = '미리듣기 종료 · 전체 곡은 iTunes에서 확인하세요'
  })
  audio.addEventListener('error', () => {
    updatePlaying(false)
    status.textContent = '미리듣기를 불러올 수 없어요. 다른 곡이나 iTunes 링크를 확인해주세요.'
  })
  window.addEventListener('pagehide', () => { version++; pending = false; audio.pause() })
}
