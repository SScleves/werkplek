import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')
mkdirSync(pub, { recursive: true })

const ACCENT = '#4f6ef7'

// A "W" mark drawn as a thick rounded polyline so no font is needed.
const mark = (bgRadius) => `
  <rect width="512" height="512" rx="${bgRadius}" fill="${ACCENT}"/>
  <path d="M112 150 L186 384 L256 232 L326 384 L400 150"
        fill="none" stroke="#ffffff" stroke-width="48"
        stroke-linejoin="round" stroke-linecap="round"/>
`

const svg = (radius) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${mark(radius)}</svg>`

// favicon (crisp SVG)
writeFileSync(join(pub, 'favicon.svg'), svg(110))

const targets = [
  { name: 'icon-192.png', size: 192, radius: 110 },
  { name: 'icon-512.png', size: 512, radius: 110 },
  // maskable: solid background to the edges (radius 0) so it survives masking
  { name: 'maskable-512.png', size: 512, radius: 0 },
  { name: 'apple-touch-icon.png', size: 180, radius: 0 },
]

for (const t of targets) {
  await sharp(Buffer.from(svg(t.radius)))
    .resize(t.size, t.size)
    .png()
    .toFile(join(pub, t.name))
  console.log('wrote', t.name)
}
