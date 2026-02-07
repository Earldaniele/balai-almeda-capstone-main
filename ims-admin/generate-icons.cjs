const fs = require('fs');
const sharp = require('sharp');

function generateSVG(size) {
  const fontSize = Math.round(size * 0.35);
  const subFontSize = Math.round(size * 0.1);
  const borderRadius = Math.round(size * 0.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#334155"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="url(#bg)"/>
  <text x="50%" y="48%" text-anchor="middle" dominant-baseline="middle" 
    font-family="Arial, sans-serif" font-weight="700" font-size="${fontSize}" 
    fill="#f8fafc">BA</text>
  <text x="50%" y="75%" text-anchor="middle" dominant-baseline="middle" 
    font-family="Arial, sans-serif" font-weight="400" font-size="${subFontSize}" 
    fill="#94a3b8">ADMIN</text>
</svg>`;
}

async function main() {
  fs.mkdirSync('public/icons', { recursive: true });

  // Generate SVGs
  fs.writeFileSync('public/icons/icon.svg', generateSVG(512));

  // Generate PNGs from SVG using sharp
  const svg192 = Buffer.from(generateSVG(192));
  const svg512 = Buffer.from(generateSVG(512));

  await sharp(svg192).png().toFile('public/icons/icon-192x192.png');
  await sharp(svg512).png().toFile('public/icons/icon-512x512.png');

  console.log('PWA icons created (SVG + PNG)!');
}

main().catch(console.error);
