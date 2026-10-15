import album from './swag-ii.json'
import { activateAudioPulse } from './audio-pulse'
import { createButtonSound } from './button-sound'

export function initializePreviews(onTrackSelected?: (title: string) => void) {
  const playButtonSound = createButtonSound()
  document.querySelectorAll<HTMLButtonElement>('.player-hit').forEach(button => {
    button.addEventListener('click', playButtonSound)
  })
  const audio = new Audio()
  audio.crossOrigin = 'anonymous'
  audio.preload = 'none'
  const screen = document.querySelector<HTMLDivElement>('#album-screen')!
  const artwork = document.querySelector<HTMLImageElement>('#album-art')!
  const title = document.querySelector('#track-title')!
  const position = document.querySelector('#track-position')!
  const info = document.querySelector<HTMLDivElement>('#preview-info')!
  const status = document.querySelector('#preview-status')!
  const toggle = document.querySelector<HTMLButtonElement>('#toggle-preview')!
  const link = document.querySelector<HTMLAnchorElement>('#itunes-link')!
  const menu = document.querySelector<HTMLDivElement>('#track-menu')!
  const list = document.querySelector<HTMLDivElement>('#track-list')!
  const menuButton = document.querySelector<HTMLButtonElement>('#open-track-menu')!
  const up = document.querySelector<HTMLButtonElement>('#menu-up')!
  const down = document.querySelector<HTMLButtonElement>('#menu-down')!
  let menuOpen = false
  let cursor = 0
  const options = album.tracks.map((track, index) => {
    const option = document.createElement('div')
    option.id = `track-option-${index}`
    option.className = 'track-option'
    option.setAttribute('role', 'option')
    option.textContent = `${String(index + 1).padStart(2, '0')}  ${track.title}`
    option.addEventListener('click', () => { cursor = index; select(cursor, true) })
    list.append(option)
    return option
  })
  let selected = -1
  let version = 0
  let pending = false

  function updatePlaying(playing: boolean) {
    toggle.setAttribute('aria-pressed', String(playing && !menuOpen))
    toggle.setAttribute('aria-label', menuOpen ? '선택한 곡 미리듣기 재생' : playing ? '미리듣기 일시정지' : '미리듣기 재생')
    toggle.classList.toggle('is-playing', playing && !menuOpen)
  }

  function highlight() {
    options.forEach((option, index) => option.setAttribute('aria-selected', String(index === cursor)))
    const option = options[cursor]!
    list.setAttribute('aria-activedescendant', option.id)
    document.querySelector('#menu-position')!.textContent = `${String(cursor + 1).padStart(2, '0')} / ${album.tracks.length}`
    const top = option.offsetTop
    if (top < list.scrollTop) list.scrollTop = top
    else if (top + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + option.offsetHeight - list.clientHeight
    }
  }

  function showMenu(open: boolean) {
    menuOpen = open
    menu.hidden = !open
    menuButton.setAttribute('aria-expanded', String(open))
    up.disabled = down.disabled = !open
    screen.hidden = open || selected < 0
    updatePlaying(!audio.paused)
    if (open) {
      cursor = Math.max(0, selected)
      highlight()
      list.focus({ preventScroll: true })
    }
  }

  function moveCursor(direction: number) {
    if (!menuOpen) return
    cursor = Math.max(0, Math.min(album.tracks.length - 1, cursor + direction))
    highlight()
  }
  menuButton.addEventListener('click', () => showMenu(!menuOpen))
  up.addEventListener('click', () => moveCursor(-1))
  down.addEventListener('click', () => moveCursor(1))
  list.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveCursor(event.key === 'ArrowUp' ? -1 : 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select(cursor, true)
    } else if (event.key === 'Escape') {
      showMenu(false)
      menuButton.focus()
    }
  })

  async function play() {
    const requestedVersion = version
    pending = true
    status.textContent = '미리듣기를 불러오는 중…'
    try {
      activateAudioPulse(audio)
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
    onTrackSelected?.(track.title)
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
    showMenu(false)
    updatePlaying(false)
    if (resume) void play()
  }

  toggle.addEventListener('click', () => {
    if (menuOpen) { select(cursor, true); return }
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
  document.querySelector('#replay-preview')!.addEventListener('click', () => {
    if (selected < 0) { select(0, true); return }
    version++
    pending = false
    audio.pause()
    audio.currentTime = 0
    void play()
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
