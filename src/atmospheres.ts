// Art-directed palettes drawn from the supplied grainy pastel references.
// These are curated colour choices, not genre labels returned by Apple.
export const moods = {
  daydream: { colors: ['#e7e5d7', '#81b5c0', '#e7a4a8', '#326f7c'], speed: 0.13 },
  warmth: { colors: ['#eee5cf', '#e9b77d', '#d88770', '#96b3b4'], speed: 0.18 },
  drift: { colors: ['#dde6d8', '#86a99a', '#6ca8be', '#194c58'], speed: 0.1 },
  afterglow: { colors: ['#e3dcdf', '#ac9dc4', '#dda1ac', '#676b94'], speed: 0.16 },
  rose: { colors: ['#eee3db', '#dfa5ab', '#edc4b0', '#738e9b'], speed: 0.12 },
  amber: { colors: ['#e9e0cd', '#e0aa71', '#ca8276', '#315c65'], speed: 0.17 },
  ice: { colors: ['#e5e9e4', '#8fcede', '#5da8bc', '#527a8b'], speed: 0.16 },
  meadow: { colors: ['#e5ead8', '#c2d786', '#809c71', '#7cafbd'], speed: 0.11 },
} as const

export type Mood = keyof typeof moods

export const trackAtmospheres: Record<string, Mood> = {
  'SPEED DEMON': 'ice',
  'BETTER MAN': 'warmth',
  'LOVE SONG': 'rose',
  'I DO': 'meadow',
  "I THINK YOU'RE SPECIAL": 'daydream',
  'MOTHER IN YOU': 'warmth',
  'WITCHYA': 'drift',
  'EYE CANDY': 'daydream',
  "DON'T WANNA": 'afterglow',
  'BAD HONEY': 'amber',
  'NEED IT': 'drift',
  'OH MAN': 'rose',
  'POPPIN’ MY S***': 'amber',
  'ALL THE WAY': 'meadow',
  'PETTING ZOO': 'afterglow',
  'MOVING FAST': 'ice',
  'SAFE SPACE': 'drift',
  "LYIN'": 'rose',
  'DOTTED LINE': 'warmth',
  'OPEN UP YOUR HEART': 'daydream',
  "WHEN IT'S OVER": 'afterglow',
  'EVERYTHING HALLELUJAH': 'meadow',
  'STORY OF GOD': 'warmth',
}
