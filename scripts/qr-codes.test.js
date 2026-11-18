const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { normalizeDestination, generateQr, generateSiteQrCodes } = require('./lib/qr-codes');

test('accepts email and web destinations without duplicating mailto', () => {
  assert.equal(normalizeDestination(' info@example.org '), 'mailto:info@example.org');
  assert.equal(normalizeDestination('mailto:info@example.org'), 'mailto:info@example.org');
  assert.equal(normalizeDestination('https://example.org/join'), 'https://example.org/join');
  for (const value of ['', 'not an email', 'javascript:alert(1)', 'mailto:invalid']) {
    assert.throws(() => normalizeDestination(value));
  }
});

test('changing destination generates a new image and rejects overly dense codes', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lnl-qr-'));
  try {
    const output = path.join(dir, 'qr.png');
    await generateQr('first@example.org', output);
    const first = await fs.readFile(output);
    await generateQr('second@example.org', output);
    assert.notDeepEqual(await fs.readFile(output), first);
    await assert.rejects(generateQr('https://example.org/' + 'x'.repeat(400), output), /too long/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('custom images override generation while coalition uses its button URL', async () => {
  const site = { contact: { email: 'info@example.org' }, footerQrImageOverride: '/custom-footer.png' };
  const pages = { home: { coalitionCta: { buttonUrl: 'https://example.org/join', qrImageOverride: '/custom-coalition.png' } } };
  await generateSiteQrCodes({ site, pages }, '/does-not-exist');
  assert.equal(pages.home.coalitionCta.qrImage, '/custom-coalition.png');
  assert.equal(site.footerQrAlt, 'Scan to email info@example.org');
});
