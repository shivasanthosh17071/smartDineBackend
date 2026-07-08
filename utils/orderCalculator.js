const TAX_RATE = 0.05; // 5% GST (example, adjust as needed)
const SERVICE_CHARGE_RATE = 0.1; // 10% service charge (example)

/**
 * Calculates subtotal, tax, service charge, and total for a set of order items.
 * Each item: { price, quantity, addOns: [{price}] }
 */
const calculateOrderTotals = (items, { discountAmount = 0 } = {}) => {
  const subtotal = items.reduce((sum, item) => {
    const addOnsTotal = (item.addOns || []).reduce((a, addOn) => a + (addOn.price || 0), 0);
    return sum + (item.price + addOnsTotal) * item.quantity;
  }, 0);

  const taxAmount = Number((subtotal * TAX_RATE).toFixed(2));
  const serviceCharge = Number((subtotal * SERVICE_CHARGE_RATE).toFixed(2));
  const totalAmount = Number(
    (subtotal + taxAmount + serviceCharge - discountAmount).toFixed(2)
  );

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount,
    serviceCharge,
    discountAmount: Number(discountAmount.toFixed(2)),
    totalAmount: totalAmount < 0 ? 0 : totalAmount,
  };
};

module.exports = { calculateOrderTotals, TAX_RATE, SERVICE_CHARGE_RATE };
