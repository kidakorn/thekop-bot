import sharp from 'sharp';
import fs from 'fs';

async function test() {
  try {
    const base = await sharp({
      create: { width: 1080, height: 1080, channels: 3, background: { r: 0, g: 0, b: 0 } }
    }).jpeg().toBuffer();

    const tagText = 'OFFICIAL!';
    const tagLayer = await sharp({
      text: {
        text: `<span foreground="white" font="Prompt Bold 21" letter_spacing="2000">${tagText}</span>`,
        fontfile: './server/bot/assets/Prompt-Bold.ttf',
        rgba: true,
        dpi: 72
      }
    }).png().toBuffer();

    const lineText = 'ลิเวอร์พูลประกาศคว้าตัว วิกเตอร์ มูญอซ';
    const lineLayer = await sharp({
      text: {
        text: `<span foreground="white" font="Prompt Bold 34">${lineText}</span>`,
        fontfile: './server/bot/assets/Prompt-Bold.ttf',
        rgba: true,
        dpi: 72
      }
    }).png().toBuffer();

    const final = await sharp(base)
      .composite([
        { input: tagLayer, top: 820 - 28, left: 60 },
        { input: lineLayer, top: 880 - 46, left: 60 }
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
