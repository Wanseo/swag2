import { getAudioContext } from './audio-context'

/** Mix clicks directly to output, without interrupting mobile media playback. */
export function createButtonSound() {
  const bytes = fetch(`${import.meta.env.BASE_URL}audio/button-click.wav`)
    .then(response => response.ok ? response.arrayBuffer() : undefined)
    .catch(() => undefined)
  let decoded: Promise<AudioBuffer | undefined> | undefined
  let active: AudioBufferSourceNode | undefined
  window.addEventListener('pagehide', () => { active?.stop(); active = undefined })
  return () => {
    const context = getAudioContext()
    if (!context) return
    decoded ??= bytes.then(data => data ? context.decodeAudioData(data) : undefined).catch(() => undefined)
    void decoded.then(buffer => {
      if (!buffer || context.state !== 'running' || document.hidden) return
      active?.stop()
      const sound = context.createBufferSource()
      sound.buffer = buffer
      sound.connect(context.destination)
      sound.onended = () => { sound.disconnect(); if (active === sound) active = undefined }
      active = sound
      sound.start()
    })
  }
}
