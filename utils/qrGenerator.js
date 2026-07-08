const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

/**
 * Generates a unique QR token and a base64 QR code image
 * pointing to the customer-facing table session URL.
 */
const generateTableQR = async (tableId) => {
  const qrToken = uuidv4();
  const baseUrl = process.env.QR_BASE_URL || "http://localhost:3000/table";
  const url = `${baseUrl}/${qrToken}`;

  const qrCodeImage = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });

  return { qrToken, qrCodeImage, url };
};

module.exports = { generateTableQR };
