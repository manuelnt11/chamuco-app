import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../../..');
const assetsDir = join(projectRoot, 'documentation/assets');
const iconsOutputDir = join(__dirname, '../public/icons');
const publicOutputDir = join(__dirname, '../public');

// Create output directories
await mkdir(iconsOutputDir, { recursive: true });

// 1. Generate PWA icons
const icons = [
  { src: 'logo_icon.svg', sizes: [192, 512], suffix: '' },
  { src: 'logo_maskable.svg', sizes: [512], suffix: '-maskable' },
];

for (const { src, sizes, suffix } of icons) {
  const svgBuffer = await readFile(join(assetsDir, src));

  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();

    const filename = `icon-${size}x${size}${suffix}.png`;
    await writeFile(join(iconsOutputDir, filename), pngBuffer);
    console.log(`✓ Generated ${filename}`);
  }
}

// 2. Generate favicon files
const faviconSvg = await readFile(join(assetsDir, 'logo_icon.svg'));

// Generate PNG favicons for modern browsers
const faviconSizes = [16, 32, 48];
const faviconPaths = [];

for (const size of faviconSizes) {
  const pngBuffer = await sharp(faviconSvg).resize(size, size).png().toBuffer();
  const filepath = join(publicOutputDir, `favicon-${size}x${size}.png`);

  await writeFile(filepath, pngBuffer);
  faviconPaths.push(filepath);

  // Log for 16x16 and 32x32 (the ones referenced in HTML)
  if (size === 16 || size === 32) {
    console.log(`✓ Generated favicon-${size}x${size}.png`);
  }
}

// Generate multi-resolution favicon.ico from PNG files
const icoBuffer = await pngToIco(faviconPaths);
await writeFile(join(publicOutputDir, 'favicon.ico'), icoBuffer);
console.log('✓ Generated favicon.ico (16x16, 32x32, 48x48)');

// 3. Generate Apple touch icon (180x180)
const appleTouchIconBuffer = await sharp(faviconSvg).resize(180, 180).png().toBuffer();
await writeFile(join(publicOutputDir, 'apple-touch-icon.png'), appleTouchIconBuffer);
console.log('✓ Generated apple-touch-icon.png (180x180)');
