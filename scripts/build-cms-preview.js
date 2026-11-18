const path = require('path');
const { loadAllContent } = require('./lib/load-content');
const { site, pages } = loadAllContent();
require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, '../admin/qr-preview-source.js')],
  outfile: path.join(__dirname, '../admin/qr-preview.js'),
  bundle: true,
  minify: true,
  platform: 'browser',
  loader: { '.svg': 'text' },
  define: { CMS_QR_DEFAULTS: JSON.stringify({
    contactEmail: site.contact.email,
    footerDestination: site.footerQrDestination || site.contact.email,
    footerOverride: site.footerQrImageOverride || '',
    footerCta: pages.home.footerCta
  }) }
});
console.log('CMS QR preview built.');
