const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("0123456789", 6);

const generateInvoiceNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${datePart}-${nanoid()}`;
};

module.exports = { generateInvoiceNumber };
