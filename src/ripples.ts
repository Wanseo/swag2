export type BassRipple = { started: number; strength: number; seed: number }

/** Cache the spatial harmonics instead of recalculating angles every frame. */
export function createRippleGeometry(width: number, height: number, aspect: number, centerX: number, centerY: number) {
  const radius = new Float32Array(width * height)
  const sin3 = new Float32Array(radius.length)
  const cos3 = new Float32Array(radius.length)
  const sin5 = new Float32Array(radius.length)
  const cos5 = new Float32Array(radius.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x / width - centerX) * aspect
      const dy = y / height - centerY
      const angle = Math.atan2(dy, dx)
      const i = y * width + x
      radius[i] = Math.hypot(dx, dy)
      sin3[i] = Math.sin(angle * 3)
      cos3[i] = Math.cos(angle * 3)
      sin5[i] = Math.sin(angle * 5)
      cos5[i] = Math.cos(angle * 5)
    }
  }
  return { radius, sin3, cos3, sin5, cos5 }
}

export function createRippleFronts(ripples: BassRipple[], now: number) {
  return ripples.map(ripple => {
    const age = Math.max(0, Math.min(1, (now - ripple.started) / 2400))
    const intensity = Math.sqrt(ripple.strength)
    const phase = ripple.seed * 2.39996 + age * (ripple.seed % 2 ? -1.4 : 1.4)
    return {
      radius: age * (0.4 + ripple.strength * 1.15),
      strength: intensity * (1.1 + ripple.strength * 1.6) * (1 - age) ** 1.1,
      width: 0.065 + intensity * 0.075,
      sin: Math.sin(phase), cos: Math.cos(phase),
      sin2: Math.sin(phase * 0.67), cos2: Math.cos(phase * 0.67),
    }
  })
}

export function sampleRipples(index: number, geometry: ReturnType<typeof createRippleGeometry>, fronts: ReturnType<typeof createRippleFronts>) {
  let shift = 0
  const radius = geometry.radius[index]!
  for (const front of fronts) {
    const fold = geometry.sin3[index]! * front.cos + geometry.cos3[index]! * front.sin
    const flutter = geometry.sin5[index]! * front.cos2 - geometry.cos5[index]! * front.sin2
    const warpedRadius = radius * (1 + fold * 0.1 + flutter * 0.045)
    const edge = warpedRadius - front.radius
    if (Math.abs(edge) < front.width) {
      const envelope = Math.cos(edge / front.width * Math.PI / 2) ** 2
      shift += Math.sin(edge / front.width * Math.PI * 2) * envelope * front.strength * (1.5 + flutter * 0.2)
    }
  }
  return shift
}
