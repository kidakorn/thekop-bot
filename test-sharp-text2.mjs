import sharp from 'sharp';
import fs from 'fs';

async function test() {
  try {
    const SIZE = 1080;
    const base = await sharp({
      create: { width: SIZE, height: SIZE, channels: 3, background: { r: 50, g: 50, b: 50 } }
    }).jpeg().toBuffer();

    const tagText = 'LATEST NEWS';
    
    // Increase font size to 46 (from 21)
    const tagLayer = await sharp({
      text: {
        text: `<span foreground="white" font="Prompt Bold 46" letter_spacing="2000">${tagText}</span>`,
        fontfile: './server/bot/assets/Prompt-Bold.ttf',
        rgba: true,
        dpi: 72
      }
    }).png().toBuffer();

    // Load Logo
    const logoBuf = await sharp('./server/bot/assets/logo.png')
        .resize(180, 180, { fit: 'inside' })
        .toBuffer()
    const logoMeta = await sharp(logoBuf).metadata()
    const logoW = logoMeta.width ?? 180
    const logoH = logoMeta.height ?? 180

    const final = await sharp(base)
      .composite([
        { input: tagLayer, top: SIZE - 120, left: 60 },
        { input: logoBuf, top: SIZE - logoH - 28, left: SIZE - logoW - 28 }
      ])
      .jpeg()
      .toBuffer();

    fs.writeFileSync('test-text.jpg', final);
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
