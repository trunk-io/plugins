export function computeInvoiceTotalA(items: { price: number; qty: number; taxRate: number }[]): number {
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    tax += lineTotal * item.taxRate;
  }
  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = subtotal > 500 ? subtotal * 0.05 : 0;
  const total = subtotal + tax + shipping - discount;
  if (total < 0) {
    throw new Error("Invoice total cannot be negative");
  }
  return Math.round(total * 100) / 100;
}

export function computeInvoiceTotalB(items: { price: number; qty: number; taxRate: number }[]): number {
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const lineTotal = item.price * item.qty;
    subtotal += lineTotal;
    tax += lineTotal * item.taxRate;
  }
  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = subtotal > 500 ? subtotal * 0.05 : 0;
  const total = subtotal + tax + shipping - discount;
  if (total < 0) {
    throw new Error("Invoice total cannot be negative");
  }
  return Math.round(total * 100) / 100;
}
