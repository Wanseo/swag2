export type BassRipple = { started: number; strength: number; seed: number }
export const RIPPLE_DURATION = 4200

export function rippleDuration(strength: number) {
  return RIPPLE_DURATION - Math.max(0, Math.min(1, strength)) * 900
}

/** Cache the spatial harmonics instead of recalculating angles every frame. */
export function createRippleGeometry(width: number, height: number, aspect: number, centerX: number, centerY: number) {
  const radius = new Float32Array(width * height)
  const sin1 = new Float32Array(radius.length)
  const cos1 = new Float32Array(radius.length)
  const sin2 = new Float32Array(radius.length)
  const cos2 = new Float32Array(radius.length)
  const sin3 = new Float32Array(radius.length)
  const cos3 = new Float32Array(radius.length)
  const sin5 = new Float32Array(radius.length)
  const cos5 = new Float32Array(radius.length)
  let maxRadius = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x / width - centerX) * aspect
      const dy = y / height - centerY
      const angle = Math.atan2(dy, dx)
      const i = y * width + x
      radius[i] = Math.hypot(dx, dy)
      maxRadius = Math.max(maxRadius, radius[i]!)
      sin1[i] = Math.sin(angle)
      cos1[i] = Math.cos(angle)
      sin2[i] = Math.sin(angle * 2)
      cos2[i] = Math.cos(angle * 2)
      sin3[i] = Math.sin(angle * 3)
      cos3[i] = Math.cos(angle * 3)
      sin5[i] = Math.sin(angle * 5)
      cos5[i] = Math.cos(angle * 5)
    }
  }
  return { radius, sin1, cos1, sin2, cos2, sin3, cos3, sin5, cos5, maxRadius }
}

export function createRippleFronts(ripples: BassRipple[], now: number, maxRadius: number) {
  return ripples.map(ripple => {
    const age = Math.max(0, Math.min(1, (now - ripple.started) / rippleDuration(ripple.strength)))
    const intensity = ripple.strength ** 1.3
    const width = 0.05 + intensity * 0.055
    // A gentle launch preserves the beat without a sudden visual surge.
    const travel = 1 - (1 - age) ** (1.1 + ripple.strength * 0.15)
    const phase = ripple.seed * 2.39996 + age * (ripple.seed % 2 ? -0.12 : 0.12)
    return {
      // Clear even the farthest corner, including the angular warp and ring width.
      radius: travel * (maxRadius * 1.155 + width * 1.12 + 0.01),
      strength: (0.06 + intensity * 0.75) * (1 - age * 0.5),
      width,
      sin: Math.sin(phase), cos: Math.cos(phase),
      sin2: Math.sin(phase * 0.67), cos2: Math.cos(phase * 0.67),
      sin3: Math.sin(phase * 1.37), cos3: Math.cos(phase * 1.37),
      sin4: Math.sin(phase * 0.41), cos4: Math.cos(phase * 0.41),
    }
  })
}

export function sampleRipples(index: number, geometry: ReturnType<typeof createRippleGeometry>, fronts: ReturnType<typeof createRippleFronts>) {
  let shift = 0
  const radius = geometry.radius[index]!
  for (const front of fronts) {
    // Most pixels are outside the narrow front: skip their angular calculations.
    const widest = front.width * 1.12
    if (radius * 0.868 - front.radius > widest || radius * 1.132 - front.radius < -widest) continue
    const lean = geometry.sin1[index]! * front.cos3 + geometry.cos1[index]! * front.sin3
    const stretch = geometry.sin2[index]! * front.cos4 - geometry.cos2[index]! * front.sin4
    const fold = geometry.sin3[index]! * front.cos + geometry.cos3[index]! * front.sin
    const flutter = geometry.sin5[index]! * front.cos2 - geometry.cos5[index]! * front.sin2
    // Subtle asymmetry keeps the contour organic without deep folds.
    const warpedRadius = radius * (1 + lean * 0.068 + stretch * 0.038 + fold * 0.019 + flutter * 0.007)
    const edge = warpedRadius - front.radius
    const width = front.width * (1 + stretch * 0.09 + flutter * 0.03)
    if (Math.abs(edge) < width) {
      const envelope = Math.cos(edge / width * Math.PI / 2) ** 2
      const surge = 0.9 + lean * 0.1 + fold * 0.05
      shift += Math.sin(edge / width * Math.PI) * envelope * front.strength * surge
    }
  }
  return shift
}
