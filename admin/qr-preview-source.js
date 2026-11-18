const { renderQrSvg, normalizeDestination } = require('../scripts/lib/qr-design');
const favicon = require('../lnl-favicon.svg');

window.LnlQrPreview = {
  defaults: CMS_QR_DEFAULTS,
  image(destination) {
    const payload = normalizeDestination(destination);
    const logo = favicon.replace(/<\?xml[^>]*\?>/, '').replace('<svg ', '<svg x="762" y="762" width="360" height="360" ');
    const svg = renderQrSvg(payload).replace('</svg>', `${logo}</svg>`);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
};
