const QRCode = require('qrcode/lib/core/qrcode');

function normalizeDestination(value) {
  const destination = String(value || '').trim();
  if (!destination.includes(':') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) return `mailto:${destination}`;
  const url = new URL(destination);
  if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) {
    throw new Error('QR destination must be an email address or an http(s) link.');
  }
  if (url.protocol === 'mailto:' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url.pathname)) {
    throw new Error('QR email address is invalid.');
  }
  return destination;
}

function renderQrSvg(destination) {
  const payload = normalizeDestination(destination);
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'H' });
  // Keep modules large enough for the 100px mobile layout.
  if (qr.modules.size > 41) throw new Error('QR destination is too long for the footer. Please use a shorter link.');
  const size = qr.modules.size;
  const moduleSize = 1260 / size;
  const squares = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.modules.get(y, x)) squares.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1896" height="1896" viewBox="0 0 1896 1896">
    <rect width="1896" height="1896" fill="white"/>
    <g fill="black">
      <rect x="0" y="0" width="324" height="324"/>
      <rect x="1560" y="0" width="336" height="324"/>
      <rect x="0" y="1560" width="324" height="336"/>
      <path d="M1668 1572H1884V1884H1572V1752H1668Z"/>
    </g>
    <rect x="300" y="300" width="1284" height="1284" fill="white"/>
    <path d="${squares.join('')}" transform="translate(312 312) scale(${moduleSize})" fill="black"/>
    <rect x="738" y="738" width="408" height="408" rx="45" fill="white"/>
  </svg>`;
}

module.exports = { normalizeDestination, renderQrSvg };
