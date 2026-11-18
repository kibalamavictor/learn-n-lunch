# Updating QR codes in the CMS

## Footer on every page

Open **Site Settings → Global Site Settings → Footer QR Email or Link**.
Enter an email address (such as `info@learnandlunch.org`) or a full `https://` link. Leave it empty to follow the email on the Contact Us page.

## Home page coalition section

Open **Pages → Home → Student Coalition CTA → Button URL**.
Update the signup form link. The button and generated QR code use that same address.

## Publishing and custom designs

Publish the change to regenerate the QR image during the site build. The CMS preview pane shows the branded QR code and footer card as you edit. The coalition QR appears in the Home preview, and the footer QR appears in Global Site Settings, Home, and Impact previews. Global footer settings edited in a separate entry appear on page previews after publishing. Both generated codes use a clean white background and centered favicon logo.

To supply your own QR code, upload an image in the corresponding **Custom QR Image (optional)** field. Clear the field to return to automatic generation. Uploaded images are used as supplied and their destinations are not changed automatically.

Use short URLs: the build rejects destinations that make the generated code too dense for its mobile display size.

## Verification

Run `node --test scripts/qr-codes.test.js scripts/cms-preview.test.js` for destination normalization, regeneration, and image override checks.
