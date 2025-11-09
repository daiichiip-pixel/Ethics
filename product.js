// Seed product data for demo site.
// Replace images in images/ with real product photos and adjust paths as needed.

window.VAST_PRODUCTS = [
  {
    id: "vst-001",
    title: "VAST Runner — Elite",
    category: "shoes",
    price: 149.00,
    currency: "USD",
    description: "Lightweight running shoe for speed and comfort. Engineered mesh, responsive foam, and durable outsole.",
    images: ["images/shoe-1.jpg", "images/shoe-1-2.jpg"],
    variants: [{ sku: "VST-R-001", size: "9" , color: "Black" }, { sku: "VST-R-002", size: "10", color: "White" }]
  },
  {
    id: "vst-002",
    title: "VAST Trainer Jacket",
    category: "apparel",
    price: 119.00,
    currency: "USD",
    description: "Water-repellent trainer jacket with breathable vents and secure pockets.",
    images: ["images/jacket-1.jpg"],
    variants: [{ sku: "VST-J-001", size: "M", color: "Black" }, { sku: "VST-J-002", size: "L", color: "Olive" }]
  },
  {
    id: "vst-003",
    title: "VAST Performance Tee",
    category: "apparel",
    price: 29.00,
    currency: "USD",
    description: "Moisture-wicking performance tee for daily training.",
    images: ["images/tee-1.jpg"],
    variants: [{ sku: "VST-T-001", size: "M", color: "Grey" }]
  },
  {
    id: "vst-004",
    title: "VAST Sport Cap",
    category: "accessories",
    price: 24.00,
    currency: "USD",
    description: "Classic performance cap with adjustable strap.",
    images: ["images/cap-1.jpg"],
    variants: [{ sku: "VST-C-001", color: "Black" }]
  }
];