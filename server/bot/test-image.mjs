// Quick test: downloads a sample image, runs processImage(), saves to test-output.jpg
import axios from 'axios'
import sharp from 'sharp'
import { writeFile, readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = path.join(__dirname, 'assets', 'LOGO.png')
const FONT_PATH = path.join(__dirname, 'assets', 'Prompt-Bold.ttf')
const SIZE = 1080

// ใส่ URL รูปทดสอบ
const TEST_IMAGE_URL = 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'

// ทดสอบหัวข้อข่าว
const ENG_TITLE = 'Liverpool officially agree £35m deal to sign Victor Munoz'
const TH_TITLE = 'ลิเวอร์พูลประกาศคว้าตัว วิกเตอร์ มูญอซ อย่างเป็นทางการเรียบร้อยแล้ว'

function getNewsCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('official') || t.includes('confirm') || t.includes('sign')) return 'OFFICIAL!'
  if (t.includes('here we go') || t.includes('agree')) return 'HERE WE GO!'
  if (t.includes('breaking')) return 'BREAKING NEWS'
  if (t.includes('injury')) return 'INJURY UPDATE'
  return 'LATEST NEWS'
}

// Function แยกบรรทัด ไม่ให้เกิน maxChars ต่อบรรทัด
function wrapText(text, maxChars = 32) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      if (currentLine) lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine += word + ' '
    }
  }
  if (currentLine) lines.push(currentLine.trim())
  return lines
}

async function processImage(imageUrl, engTitle, thTitle) {
  // 1. Download source
  const imgRes = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 12000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const inputBuf = Buffer.from(imgRes.data)

  // 2. Resize
  const base = await sharp(inputBuf)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // 3. Gradient
  const gradientSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.0"/>
        <stop offset="40%"  stop-color="#000" stop-opacity="0.20"/>
        <stop offset="75%"  stop-color="#000" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
  </svg>`

  // 4. Text SVG
  const tag = getNewsCategory(engTitle)
  const wrappedLines = wrapText(thTitle, 40) // ตัดบรรทัดภาษาไทย
  
  // โหลด Font มาแปลงเป็น Base64 ฝังใน SVG
  const fontBuffer = await readFile(FONT_PATH)
  const fontBase64 = fontBuffer.toString('base64')

  // สร้าง Svg Text (มีหลายบรรทัด)
  let textSvgLines = `<text x="60" y="820" font-family="Prompt" font-weight="bold" font-size="28" fill="#ffffff" letter-spacing="2">${tag}</text>`
  
  let startY = 880
  wrappedLines.forEach((line, idx) => {
    // ให้แสดงได้สูงสุด 3 บรรทัด
    if (idx < 3) {
      textSvgLines += `<text x="60" y="${startY}" font-family="Prompt" font-weight="bold" font-size="46" fill="#ffffff">${line}</text>`
      startY += 65
    }
  })

  const textSvg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <style>
      @font-face {
        font-family: 'Prompt';
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
      }
    </style>
    ${textSvgLines}
  </svg>`

  // 5. Logo
  const logoBuf = await sharp(LOGO_PATH)
    .resize(160, 160, { fit: 'inside' })
    .toBuffer()
  const logoMeta = await sharp(logoBuf).metadata()
  const logoW = logoMeta.width ?? 160
  const logoH = logoMeta.height ?? 160

  // 6. Composite (Gradient + Text + Logo)
  return sharp(base)
    .composite([
      { input: Buffer.from(gradientSvg), top: 0, left: 0 },
      { input: Buffer.from(textSvg), top: 0, left: 0 },
      {
        input: logoBuf,
        top: SIZE - logoH - 28,
        left: SIZE - logoW - 28,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
}

console.log('🖼️  Processing image with Text & Font...')
const result = await processImage(TEST_IMAGE_URL, ENG_TITLE, TH_TITLE)
const outPath = path.join(__dirname, 'test-output.jpg')
await writeFile(outPath, result)
console.log(`✅ Saved to: ${outPath}`)
console.log(`📦 File size: ${(result.length / 1024).toFixed(0)} KB`)
