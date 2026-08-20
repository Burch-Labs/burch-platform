/**
 * QR rendering.
 *
 * Rendered on the server as an inline SVG rather than a client-side canvas or a
 * remote image URL, for three reasons that all matter at a door:
 *
 *  - It works with JavaScript off and on a bad connection. A ticket that needs
 *    to run a script before it draws is a ticket that fails in a queue outside
 *    a venue with no signal.
 *  - SVG is resolution-independent, so it survives a screenshot, a pinch-zoom
 *    and a printed page equally well. A raster QR sized for a phone turns to
 *    mush on paper.
 *  - The token never leaves our own response. Handing it to a third-party QR
 *    image service would post every guest's ticket credential to someone else's
 *    access log.
 */
import QRCode from "qrcode";

/**
 * Ticket tokens are `<cuid>.<base64url hmac>`. Anything outside that alphabet
 * did not come from `ticketToken`, and encoding it would mean drawing a QR for
 * a payload we cannot account for.
 */
const SAFE_PAYLOAD = /^[A-Za-z0-9._~-]+$/;

export async function qrSvg(payload: string, size = 240): Promise<string> {
  if (!SAFE_PAYLOAD.test(payload)) {
    throw new Error("Refusing to encode a QR payload with unexpected characters");
  }

  return QRCode.toString(payload, {
    type: "svg",
    // Level M survives a cracked screen or a thumb over one corner. H would be
    // more forgiving still, but it inflates the module count enough to hurt
    // scanning on the small, dim phones this has to work on.
    errorCorrectionLevel: "M",
    // No quiet-zone padding from the library — the surrounding card supplies the
    // white margin, and doubling it wastes space the modules need.
    margin: 0,
    width: size,
    color: { dark: "#131E30", light: "#FFFFFF" },
  });
}

/**
 * Same code, rasterized to a PNG buffer for the one context an inline SVG
 * can't reach: an email attachment. Unlike the page render, this needs a
 * real quiet zone — there's no surrounding card to supply the white margin
 * once it's a standalone image file.
 */
export async function qrPngBuffer(payload: string, size = 480): Promise<Buffer> {
  if (!SAFE_PAYLOAD.test(payload)) {
    throw new Error("Refusing to encode a QR payload with unexpected characters");
  }

  return QRCode.toBuffer(payload, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: { dark: "#131E30", light: "#FFFFFF" },
  });
}
