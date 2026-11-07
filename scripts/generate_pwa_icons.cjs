const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = center;

  // Maskable icons need 15% padding so outer content isn't clipped
  const scale = isMaskable ? 0.75 : 0.95;
  const outerR = (size / 2) * scale;
  const ringThickness = Math.max(2, size * 0.035);
  const coinR = outerR - ringThickness * 1.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= outerR) {
        if (dist > outerR - ringThickness) {
          // Emerald Ring border
          png.data[idx] = 16;      // R
          png.data[idx + 1] = 185;  // G
          png.data[idx + 2] = 129;  // B
          png.data[idx + 3] = 255;  // A
        } else if (dist <= coinR) {
          // Gold coin inner body
          // Subtle gradient from top-left to bottom-right
          const grad = 0.85 + 0.3 * ((dx + dy) / (2 * coinR));
          const r = Math.min(255, Math.max(0, Math.round(245 * grad)));
          const g = Math.min(255, Math.max(0, Math.round(158 * grad)));
          const b = Math.min(255, Math.max(0, Math.round(11 * grad)));

          // Check if in center symbol 'A' (for Aladdin)
          const ndx = dx / coinR;
          const ndy = dy / coinR;

          // Aladdin "A" shape coordinates:
          // Triangle apex at (0, -0.55), base from (-0.4, 0.55) to (0.4, 0.55)
          let isLetterA = false;
          if (ndy >= -0.55 && ndy <= 0.55) {
            const slope = 0.55 / 1.1; // 0.5
            const halfW = (ndy + 0.55) * 0.7;
            const barY = 0.15;
            const stroke = 0.14;

            // left leg: dist to line from (0, -0.55) to (-0.38, 0.55)
            // right leg: dist to line from (0, -0.55) to (0.38, 0.55)
            const leftDist = Math.abs(dx / (coinR * 0.7) - (-(ndy + 0.55) * 0.5));
            const rightDist = Math.abs(dx / (coinR * 0.7) - ((ndy + 0.55) * 0.5));
            const onLeg = (leftDist < stroke || rightDist < stroke);
            const onCrossbar = (Math.abs(ndy - barY) < stroke * 0.7 && Math.abs(ndx) < halfW * 0.5);

            if ((onLeg || onCrossbar) && ndy <= 0.55) {
              isLetterA = true;
            }
          }

          if (isLetterA) {
            // Dark luxury emblem inside coin
            png.data[idx] = 15;     // R
            png.data[idx + 1] = 23;  // G
            png.data[idx + 2] = 42;  // B
            png.data[idx + 3] = 255; // A
          } else {
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = 255;
          }
        } else {
          // Gap between ring and coin: dark slate
          png.data[idx] = 15;
          png.data[idx + 1] = 23;
          png.data[idx + 2] = 42;
          png.data[idx + 3] = 255;
        }
      } else {
        // Outside circle
        if (isMaskable) {
          // Fill full bleed background for maskable
          png.data[idx] = 15;
          png.data[idx + 1] = 23;
          png.data[idx + 2] = 42;
          png.data[idx + 3] = 255;
        } else {
          // Transparent
          png.data[idx] = 0;
          png.data[idx + 1] = 0;
          png.data[idx + 2] = 0;
          png.data[idx + 3] = 0;
        }
      }
    }
  }

  return PNG.sync.write(png);
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIcon(180, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIcon(512, true));
console.log('Successfully generated PWA PNG icons in /public!');
