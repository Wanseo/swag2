let sharedContext: AudioContext | undefined

/** Keep music and button sounds in one user-activated audio session. */
export function getAudioContext() {
  if (!sharedContext || sharedContext.state === 'closed') {
    const AudioContextClass = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return undefined
    try { sharedContext = new AudioContextClass() } catch { return undefined }
  }
  if (sharedContext.state !== 'running') void sharedContext.resume().catch(() => {})
  return sharedContext
}
