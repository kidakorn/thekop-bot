import sharp from 'sharp'
import { writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONT_PATH = path.join(__dirname, 'assets', 'Prompt-Bold.ttf')

async function testText() {
  const textImage = await sharp({
    text: {
      text: 'ลิเวอร์พูลประกาศคว้าตัว วิกเตอร์ มูญอซ อย่างเป็นทางการ',
      font: 'Prompt',
      fontfile: FONT_PATH,
      width: 900,
      rgba: true
    }
  }).toBuffer()

  const bg = await sharp({ create: { width: 1000, height: 300, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } })
    .composite([{ input: textImage, top: 50, left: 50 }])
    .png()
    .toBuffer()

  await writeFile(path.join(__dirname, 'test-text.png'), bg)
  console.log('✅ Created test-text.png')
}

testText().catch(console.error)
