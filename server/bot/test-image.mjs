// Quick test: downloads a sample image, runs processImage(), saves to test-output.jpg
import axios from 'axios'
import sharp from 'sharp'
import { writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = path.join(__dirname, 'assets', 'LOGO.png')
const SIZE = 1080
const BORDER = 12

// ใส่ URL รูปทดสอบ (og:image จาก LFC official หรือ Pexels)
const TEST_IMAGE_URL = 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'

async function processImage(imageUrl) {
  // 1. Download with browser User-Agent (some sites block plain axios)
  const imgRes = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  })
  const inputBuf = Buffer.from(imgRes.data)

  // 2. Resize to 1080×1080
  const base = await sharp(inputBuf)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // 3. Gradient overlay (เข้มขึ้นตั้งแต่ 40%)
  const gradientSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.0"/>
        <stop offset="40%"  stop-color="#000" stop-opacity="0.20"/>
        <stop offset="75%"  stop-color="#000" stop-opacity="0.62"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
      </linearGradient>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
  </svg>`

  // 4. Logo
  const logoBuf = await sharp(LOGO_PATH)
    .resize(180, 180, { fit: 'inside' })
    .toBuffer()
  const logoMeta = await sharp(logoBuf).metadata()
  const logoW = logoMeta.width ?? 180
  const logoH = logoMeta.height ?? 180

  // 5. Composite: gradient + logo
  return sharp(base)
    .composite([
      { input: Buffer.from(gradientSvg), top: 0, left: 0 },
      {
        input: logoBuf,
        top: SIZE - logoH - 28,
        left: SIZE - logoW - 28,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
}

console.log('🖼️  Downloading test image...')
const result = await processImage(TEST_IMAGE_URL)
const outPath = path.join(__dirname, 'test-output.jpg')
await writeFile(outPath, result)
console.log(`✅ Saved to: ${outPath}`)
console.log(`📦 File size: ${(result.length / 1024).toFixed(0)} KB`)
