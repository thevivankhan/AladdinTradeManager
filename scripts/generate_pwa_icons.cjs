const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const SOURCE_PATH = path.join(ROOT, 'public/assets/aistudio/1794310576052_f508796e.jpg');
const PUBLIC_DIR = path.join(ROOT, 'public');

function extractCleanLogo() {
  const src = PNG.sync.read(fs.readFileSync(SOURCE_PATH));
  const { width, height, data } = src;

  // Step 1: Compute per-pixel foreground alpha using exact green-chroma + dark-rim physics
  // Background paper & shadow are neutral warm gray (g-r in [-8..+4], lum in [95..255]).
  // Every pixel of the 3D green diamond + lamp is distinctly green (even darkest rim has g-r >= 9 and lum < 55).
  const alphaArr = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const idx = p << 2;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Ignore the bottom-right corner watermark completely
      if (x > width - 250 && y > height - 250) {
        alphaArr[p] = 0;
        continue;
      }

      const gr = g - r;
      const gb = g - b;
      const lum = (r + g + b) / 3;

      // Primary green signal (works for both emerald and bright lime)
      const greenSignal = gr + Math.max(0, gb - 4) * 0.45;

      let a = 0;
      if (lum < 55) {
        // Very dark green outer bevel rim (e.g. rgb(2,13,9) -> gr=11, lum=8)
        // Shadow on paper never goes below lum ~95
        if (gr >= 8 || lum < 35) {
          a = 1;
        } else if (gr > 3) {
          a = (gr - 3) / 5;
        }
      } else if (lum < 120) {
        // Transition between dark shadow on paper (lum ~100-140, gr <= 3) and dark green emblem (gr >= 18)
        if (greenSignal >= 18) {
          a = 1;
        } else if (greenSignal > 6) {
          a = (greenSignal - 6) / 12;
        }
      } else {
        // Mid-to-bright region: paper/light shadow has gr <= 2, gb <= 7 (greenSignal <= 4)
        // Bright green / lime bevel has greenSignal >= 24..200+
        if (greenSignal >= 26) {
          a = 1;
        } else if (greenSignal > 7) {
          a = (greenSignal - 7) / 19;
        }
      }

      alphaArr[p] = Math.max(0, Math.min(1, a));
    }
  }

  // Step 2: Remove tiny isolated noise specks (connected component / local 3x3 check)
  // Keep only pixels that belong to the main emblem region
  const cleanAlpha = new Float32Array(alphaArr);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (alphaArr[p] > 0 && alphaArr[p] < 0.85) {
        let solidNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (alphaArr[(y + dy) * width + (x + dx)] > 0.7) solidNeighbors++;
          }
        }
        if (solidNeighbors === 0) {
          cleanAlpha[p] = 0;
        }
      }
    }
  }

  // Step 3: Find tight bounding box of the emblem
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cleanAlpha[y * width + x] > 0.1) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const squareSide = Math.max(cropW, cropH);
  // Add small symmetrical breathing margin (~3%) so rounded tips never clip
  const pad = Math.round(squareSide * 0.03);
  const outSize = squareSide + pad * 2;
  const offsetX = Math.floor((outSize - cropW) / 2);
  const offsetY = Math.floor((outSize - cropH) / 2);

  console.log(`Logo bounding box: (${minX},${minY})-(${maxX},${maxY}) => ${cropW}x${cropH}, centered into ${outSize}x${outSize}`);

  const out = new PNG({ width: outSize, height: outSize });

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const sx = minX + x;
      const sy = minY + y;
      const sp = sy * width + sx;
      const sIdx = sp << 2;
      const a = cleanAlpha[sp];

      const dx = offsetX + x;
      const dy = offsetY + y;
      const dIdx = (dy * outSize + dx) << 2;

      if (a <= 0.01) {
        out.data[dIdx] = 0;
        out.data[dIdx + 1] = 0;
        out.data[dIdx + 2] = 0;
        out.data[dIdx + 3] = 0;
        continue;
      }

      let r = data[sIdx];
      let g = data[sIdx + 1];
      let b = data[sIdx + 2];

      // Decontaminate semi-transparent edge pixels (un-premultiply paper/shadow color)
      // so there is ZERO white or gray fringe on dark backgrounds!
      if (a < 0.99) {
        const lum = (r + g + b) / 3;
        const bgR = lum > 150 ? 236 : 120;
        const bgG = lum > 150 ? 232 : 116;
        const bgB = lum > 150 ? 228 : 113;
        r = Math.max(0, Math.min(255, Math.round((r - (1 - a) * bgR) / a)));
        g = Math.max(0, Math.min(255, Math.round((g - (1 - a) * bgG) / a)));
        b = Math.max(0, Math.min(255, Math.round((b - (1 - a) * bgB) / a)));
      }

      out.data[dIdx] = r;
      out.data[dIdx + 1] = g;
      out.data[dIdx + 2] = b;
      out.data[dIdx + 3] = Math.round(a * 255);
    }
  }

  const rawMasterPath = path.join(PUBLIC_DIR, '_master_raw.png');
  fs.writeFileSync(rawMasterPath, PNG.sync.write(out));
  return rawMasterPath;
}

function generateAllIcons() {
  const rawMaster = extractCleanLogo();
  const master1024 = path.join(PUBLIC_DIR, 'aladdin-logo.png');

  // Crisp Lanczos-resized 1024x1024 transparent master
  execSync(`convert "${rawMaster}" -filter Lanczos -resize 1024x1024 -strip "${master1024}"`);

  // Standard transparent web & PWA icons (only scaled cleanly, 100% original!)
  execSync(`convert "${master1024}" -filter Lanczos -resize 512x512 -strip "${path.join(PUBLIC_DIR, 'pwa-512x512.png')}"`);
  execSync(`convert "${master1024}" -filter Lanczos -resize 192x192 -strip "${path.join(PUBLIC_DIR, 'pwa-192x192.png')}"`);
  execSync(`convert "${master1024}" -filter Lanczos -resize 64x64 -strip "${path.join(PUBLIC_DIR, 'favicon-64x64.png')}"`);
  execSync(`convert "${master1024}" -filter Lanczos -resize 32x32 -strip "${path.join(PUBLIC_DIR, 'favicon-32x32.png')}"`);
  execSync(`convert "${master1024}" -filter Lanczos -resize 16x16 -strip "${path.join(PUBLIC_DIR, 'favicon-16x16.png')}"`);

  // Multi-resolution favicon.ico (16, 32, 48)
  execSync(`convert "${master1024}" -define icon:auto-resize=48,32,16 "${path.join(PUBLIC_DIR, 'favicon.ico')}"`);

  // Maskable 512x512 icon (15% safe-zone padding on dark app background so Android circle/squircle never clips tips)
  execSync(`convert -size 512x512 xc:"#05070e" \\( "${master1024}" -filter Lanczos -resize 384x384 \\) -gravity center -composite -strip "${path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png')}"`);

  // iOS Apple Touch Icon 180x180 (solid dark background #05070e with clean 10% margin because iOS doesn't support alpha on home screen)
  execSync(`convert -size 180x180 xc:"#05070e" \\( "${master1024}" -filter Lanczos -resize 148x148 \\) -gravity center -composite -strip "${path.join(PUBLIC_DIR, 'apple-touch-icon.png')}"`);

  // SVG wrapper embedding crisp 256x256 PNG so /icon.svg renders the exact original icon in every browser
  const icon256Buf = execSync(`convert "${master1024}" -filter Lanczos -resize 256x256 -strip png:-`);
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">\n  <image href="data:image/png;base64,${icon256Buf.toString('base64')}" width="256" height="256" />\n</svg>\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), iconSvg, 'utf8');

  // Android Capacitor Launcher Icons (if android/res exists)
  const androidRes = path.join(ROOT, 'android/app/src/main/res');
  if (fs.existsSync(androidRes)) {
    const densities = [
      { dir: 'mipmap-mdpi', size: 48, fg: 108 },
      { dir: 'mipmap-hdpi', size: 72, fg: 162 },
      { dir: 'mipmap-xhdpi', size: 96, fg: 216 },
      { dir: 'mipmap-xxhdpi', size: 144, fg: 324 },
      { dir: 'mipmap-xxxhdpi', size: 192, fg: 432 },
    ];
    for (const d of densities) {
      const targetDir = path.join(androidRes, d.dir);
      if (!fs.existsSync(targetDir)) continue;

      const inner = Math.round(d.size * 0.84);
      const fgInner = Math.round(d.fg * 0.66);

      // Standard launcher icon
      execSync(`convert -size ${d.size}x${d.size} xc:"#05070e" \\( "${master1024}" -filter Lanczos -resize ${inner}x${inner} \\) -gravity center -composite -strip "${path.join(targetDir, 'ic_launcher.png')}"`);

      // Round launcher icon
      execSync(`convert -size ${d.size}x${d.size} xc:none -fill "#05070e" -draw "circle ${d.size/2},${d.size/2} ${d.size/2},0" \\( "${master1024}" -filter Lanczos -resize ${Math.round(d.size * 0.78)}x${Math.round(d.size * 0.78)} \\) -gravity center -composite -strip "${path.join(targetDir, 'ic_launcher_round.png')}"`);

      // Adaptive foreground icon (transparent with safe zone padding)
      const fgPath = path.join(targetDir, 'ic_launcher_foreground.png');
      if (fs.existsSync(fgPath)) {
        execSync(`convert -size ${d.fg}x${d.fg} xc:none \\( "${master1024}" -filter Lanczos -resize ${fgInner}x${fgInner} \\) -gravity center -composite -strip "${fgPath}"`);
      }
    }

    // Update adaptive background XML color to match dark theme (#05070e)
    const bgXml = path.join(androidRes, 'values/ic_launcher_background.xml');
    if (fs.existsSync(bgXml)) {
      fs.writeFileSync(bgXml, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#05070E</color>\n</resources>\n`, 'utf8');
    }
    console.log('Successfully updated Android mipmap launcher icons!');
  }

  // Clean up temporary raw master
  if (fs.existsSync(rawMaster)) fs.unlinkSync(rawMaster);
  console.log('Successfully generated ALL clean transparent & PWA icons from original logo!');
}

generateAllIcons();
