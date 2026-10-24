// Sinh icon PWA và ảnh splash iOS từ plans/assets/clr-logo.jpg. Chạy một lần: node scripts/generateIcons.mjs
// Dùng sharp có sẵn qua Next.js, không thêm vào dependencies.
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SOURCE = 'plans/assets/clr-logo.jpg'
const OUTPUT_DIR = 'public/icons'
const DISC = { centerX: 415, centerY: 403, radius: 303 }
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
const SPLASH_BACKGROUND = { r: 244, g: 245, b: 247, alpha: 1 }
const SPLASH_LOGO_WIDTH_RATIO = 0.4
const MASKABLE_SAFE_RATIO = 0.7
const APPLE_ICON_RATIO = 0.92

const SPLASH_SIZES = [
  [1170, 2532],
  [1179, 2556],
  [1290, 2796],
  [1125, 2436],
  [828, 1792],
  [1242, 2688],
]

// Vòng tròn trắng chữ CLR, bỏ viền lá vàng để còn đọc được ở icon nhỏ
async function roundDisc(size) {
  const side = DISC.radius * 2
  const crop = await sharp(SOURCE)
    .extract({
      left: DISC.centerX - DISC.radius,
      top: DISC.centerY - DISC.radius,
      width: side,
      height: side,
    })
    .resize(size, size)
    .toBuffer()
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  )
  return sharp(crop)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

async function writeSquare(name, size, discRatio) {
  const discSize = Math.round(size * discRatio)
  const offset = Math.round((size - discSize) / 2)
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: await roundDisc(discSize), left: offset, top: offset }])
    .flatten({ background: WHITE })
    .png()
    .toFile(`${OUTPUT_DIR}/${name}`)
}

async function writeSplash(width, height) {
  const discSize = Math.round(width * SPLASH_LOGO_WIDTH_RATIO)
  await sharp({
    create: { width, height, channels: 4, background: SPLASH_BACKGROUND },
  })
    .composite([
      {
        input: await roundDisc(discSize),
        left: Math.round((width - discSize) / 2),
        top: Math.round((height - discSize) / 2),
      },
    ])
    .flatten({ background: SPLASH_BACKGROUND })
    .png()
    .toFile(`${OUTPUT_DIR}/splash-${width}x${height}.png`)
}

mkdirSync(OUTPUT_DIR, { recursive: true })
await writeSquare('icon-192.png', 192, 1)
await writeSquare('icon-512.png', 512, 1)
await writeSquare('icon-512-maskable.png', 512, MASKABLE_SAFE_RATIO)
await writeSquare('apple-touch-icon.png', 180, APPLE_ICON_RATIO)
for (const [width, height] of SPLASH_SIZES) await writeSplash(width, height)
