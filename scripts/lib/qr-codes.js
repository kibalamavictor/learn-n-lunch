const path = require('path');
const { normalizeDestination, renderQrSvg } = require('./qr-design');
const sharp = require('sharp');

async function generateQr(destination, outputPath, root = process.cwd()) {
  const svg = renderQrSvg(destination);
  const logo = await sharp(path.join(root, 'lnl-favicon.svg')).resize(360, 360).png().toBuffer();
  await sharp(Buffer.from(svg)).composite([{ input: logo, left: 762, top: 762 }]).png().toFile(outputPath);
}

async function generateSiteQrCodes({ site, pages }, root = process.cwd()) {
  const footerDestination = normalizeDestination(site.footerQrDestination || site.contact.email);
  const coalitionDestination = normalizeDestination(pages.home.coalitionCta.buttonUrl);
  const jobs = [];
  if (!site.footerQrImageOverride) jobs.push(generateQr(footerDestination, path.join(root, 'qr-code.png'), root));
  if (!pages.home.coalitionCta.qrImageOverride) jobs.push(generateQr(coalitionDestination, path.join(root, 'coalition-qr-code.png'), root));
  await Promise.all(jobs);
  // Apply the shared footer settings to every page at render time.
  site.footerQrAlt = `Scan to ${footerDestination.startsWith('mailto:') ? 'email ' + footerDestination.slice(7) : 'visit ' + footerDestination}`;
  pages.home.coalitionCta.qrImage = pages.home.coalitionCta.qrImageOverride || '/coalition-qr-code.png';
}

module.exports = { normalizeDestination, generateQr, generateSiteQrCodes };
