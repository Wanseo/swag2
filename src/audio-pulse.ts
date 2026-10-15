let context: AudioContext | undefined
let analyser: AnalyserNode | undefined
let source: MediaElementAudioSourceNode | undefined
let media: HTMLAudioElement | undefined
let bins: Uint8Array<ArrayBuffer> | undefined
let energy = 0
let baseline = 0
let previousBass = 0
let lastBeat = -1000

/** Create the audio graph only inside the user's play gesture. */
export function activateAudioPulse(audio: HTMLAudioElement) {
  media = audio
  if (!context) {
    try {
      context = new AudioContext()
      const nextAnalyser = context.createAnalyser()
      nextAnalyser.fftSize = 2048
      nextAnalyser.smoothingTimeConstant = 0.25
      source = context.createMediaElementSource(audio)
      source.connect(nextAnalyser)
      nextAnalyser.connect(context.destination)
      analyser = nextAnalyser
      bins = new Uint8Array(nextAnalyser.frequencyBinCount)
    } catch {
      // Preserve playback if analysis is unavailable on this browser.
      if (source && context) {
        source.disconnect()
        source.connect(context.destination)
      }
      analyser = undefined
    }
  }
  if (context?.state === 'suspended') void context.resume().catch(() => {})
}

export function readAudioPulse(now: number) {
  if (!analyser || !bins || !context || context.state !== 'running' || !media || media.paused || media.ended || media.readyState < 3) {
    energy *= 0.85
    baseline = 0
    previousBass = 0
    return { energy, beat: 0 }
  }
  analyser.getByteFrequencyData(bins)
  const binHz = context.sampleRate / analyser.fftSize
  // Only bass-band bins drive visuals; playback itself remains unfiltered.
  const start = Math.max(1, Math.ceil(40 / binHz))
  const end = Math.min(bins.length - 1, Math.floor(160 / binHz))
  let bass = 0
  for (let i = start; i <= end; i++) bass += bins[i]! / 255
  bass /= end - start + 1
  energy += (bass - energy) * (bass > energy ? 0.5 : 0.1)
  const onset = bass - previousBass
  const beat = bass > 0.12 && now - lastBeat > 210 && onset > 0.025 && bass > baseline + 0.035
    ? Math.min(1, bass * 1.4) : 0
  if (beat) lastBeat = now
  baseline += (bass - baseline) * 0.07
  previousBass = bass
  return { energy, beat }
}
