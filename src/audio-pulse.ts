let context: AudioContext | undefined
let analyser: AnalyserNode | undefined
let source: MediaElementAudioSourceNode | undefined
let media: HTMLAudioElement | undefined
let bins: Uint8Array<ArrayBuffer> | undefined
let energy = 0
let baseline = 0
let previousBass = 0
let lastBeat = -1000
let bassPeak = 0.18
let lastRead = 0

/** Create the audio graph only inside the user's play gesture. */
export function activateAudioPulse(audio: HTMLAudioElement) {
  media = audio
  if (!context) {
    try {
      context = new AudioContext()
      const nextAnalyser = context.createAnalyser()
      nextAnalyser.fftSize = 4096
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
  const elapsed = Math.min(100, Math.max(1, lastRead ? now - lastRead : 33))
  lastRead = now
  if (!analyser || !bins || !context || context.state !== 'running' || !media || media.paused || media.ended || media.readyState < 3) {
    energy *= 0.85
    baseline = 0
    previousBass = 0
    bassPeak = 0.18
    return { energy, beat: 0 }
  }
  analyser.getByteFrequencyData(bins)
  const binHz = context.sampleRate / analyser.fftSize
  // Focus on sub-bass/kick fundamentals, excluding most low vocal fundamentals.
  // Compare against vocal-range harmonics to suppress voice-led passages.
  // This is spectral gating, not full vocal/instrument source separation.
  function bandLevel(low: number, high: number) {
    const start = Math.max(1, Math.ceil(low / binHz))
    const end = Math.min(bins!.length - 1, Math.floor(high / binHz))
    let level = 0
    for (let i = start; i <= end; i++) level += (bins![i]! / 255) ** 2
    return Math.sqrt(level / (end - start + 1))
  }
  const sub = bandLevel(35, 70)
  const lowBass = bandLevel(70, 95)
  const vocalBand = bandLevel(180, 1200)
  const rawBass = sub * 0.8 + lowBass * 0.2
  const dominance = rawBass / (vocalBand + 0.08)
  const gate = Math.max(0, Math.min(1, (dominance - 0.9) / 0.8))
  const bass = rawBass * gate
  // Follow the track's recent loudness so quiet kicks retain their own dynamics.
  bassPeak = Math.max(0.18, bass, bassPeak * Math.exp(-elapsed / 2600))
  energy += (bass - energy) * (bass > energy ? 0.5 : 0.1)
  const onset = bass - previousBass
  const relativeLevel = Math.min(1, bass / bassPeak)
  const attack = Math.min(1, Math.max(0, bass - baseline) / Math.max(0.08, bassPeak * 0.65))
  // Include lighter bass hits while leaving room between gentle waves.
  const accent = bass > 0.06
    && relativeLevel > 0.38
    && attack > 0.27
    && onset > Math.max(0.013, bassPeak * 0.038)
    && bass > baseline * 1.15 + 0.011
  const beat = accent && now - lastBeat > 650
    ? Math.max(0.06, Math.min(1, relativeLevel ** 1.8 * (0.35 + attack * 0.65))) : 0
  if (beat) lastBeat = now
  baseline += (bass - baseline) * 0.07
  previousBass = bass
  return { energy, beat }
}
