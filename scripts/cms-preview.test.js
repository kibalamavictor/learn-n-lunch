const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function previewHarness() {
  const templates = {};
  const window = {
    CMS: { registerPreviewStyle() {}, registerPreviewTemplate(name, component) { templates[name] = component; } },
    h: (tag, props, ...children) => ({ tag, props: props || {}, children: children.flat(Infinity) })
  };
  const context = vm.createContext({ window, console, URL, TextEncoder });
  vm.runInContext(fs.readFileSync('admin/qr-preview.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('admin/preview.js', 'utf8'), context);
  return (name, data) => templates[name]({ entry: { getIn: () => ({ toJS: () => data }) }, getAsset: value => value });
}
function findQr(tree) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.props?.className === 'preview-qr-image') return tree;
  for (const child of tree.children || []) {
    const result = findQr(child);
    if (result) return result;
  }
  return null;
}

test('footer QR preview updates before publishing and handles invalid destinations', () => {
  const render = previewHarness();
  const first = findQr(render('site', { footerQrDestination: 'preview@example.org' }));
  const second = findQr(render('site', { footerQrDestination: 'changed@example.org' }));
  assert(first.props.src.startsWith('data:image/svg+xml'));
  assert.notEqual(first.props.src, second.props.src);
  assert.equal(findQr(render('site', { footerQrDestination: 'invalid' })), null);
});

test('uploaded images are previewed and coalition follows the button URL', () => {
  const render = previewHarness();
  assert.equal(findQr(render('site', { footerQrImageOverride: '/uploaded.png' })).props.src, '/uploaded.png');
  const first = findQr(render('home', { coalitionCta: { buttonUrl: 'https://example.org/join' } }));
  const second = findQr(render('home', { coalitionCta: { buttonUrl: 'https://example.org/new' } }));
  assert.notEqual(first.props.src, second.props.src);
  assert.equal(findQr(render('home', { coalitionCta: { qrImageOverride: '/coalition-upload.png' } })).props.src, '/coalition-upload.png');
});
