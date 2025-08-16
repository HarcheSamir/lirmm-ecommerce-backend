import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = 'http://localhost:3000';

// Run once
export const options = { vus: 1, iterations: 1 };

// ==============================================================================
// SETUP: resync → categories bulk → products bulk 
// ==============================================================================
export function setup() {
  const headers = { 'Content-Type': 'application/json' };

  console.log('--- Step 1: User Sync ---');
  http.post(`${baseUrl}/auth/resync-users`);

  console.log('--- Step 2: Bulk categories ---');
  http.post(`${baseUrl}/products/categories/bulk`);

  console.log('--- Step 3: Bulk products ---');
  http.post(`${baseUrl}/products/bulk`);

  console.log('--- Step 4: test order service availability ---');
  http.get(`${baseUrl}/orders`);

}

// ==============================================================================
// HELPERS — same logic style as your script
// ==============================================================================
function getRandomProducts(count = 1) {
  const productsToReturn = [];
  const prodRes = http.get(`${baseUrl}/products?page=1&limit=50`);
  if (prodRes.status !== 200 || !prodRes.body) return null;

  try {
    const productsData = prodRes.json().data;
    if (!productsData || productsData.length === 0) return null;

    const pickedProductIds = new Set();

    for (let i = 0; i < count; i++) {
      if (productsToReturn.length >= productsData.length) break;

      let product;
      let attempt = 0;
      do {
        product = productsData[Math.floor(Math.random() * productsData.length)];
        attempt++;
      } while (pickedProductIds.has(product.id) && attempt < 10);

      if (pickedProductIds.has(product.id)) continue;
      pickedProductIds.add(product.id);

      if (product.variants && product.variants.length > 0) {
        const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
        productsToReturn.push({ product, variant });
      }
    }
    return productsToReturn;
  } catch (e) {
    return null;
  }
}

function getRandomPastDateISO() {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  const ts = Math.random() * (now.getTime() - twoYearsAgo.getTime()) + twoYearsAgo.getTime();
  return new Date(ts).toISOString();
}

// ==============================================================================
// DEFAULT: login → 1 guest order → 1 registered order (same picking logic)
// ==============================================================================
export default function (data) {
  const headers = { 'Content-Type': 'application/json' };

  // Step 6: Guest order
  console.log('--- Step 6: Guest order ---');
  const guestSelections = getRandomProducts(Math.floor(Math.random() * 3) + 1); // 1–3 items
  if (guestSelections && guestSelections.length > 0) {
    const guestItems = guestSelections.map(sel => ({
      productId: sel.product.id,
      variantId: sel.variant.id,
      quantity: 1,
    }));

    const guestPayload = JSON.stringify({
      guestName: 'Guest User',
      guestEmail: `guest-${Date.now()}@test.com`,
      phone: '555-555-5555',
      shippingAddress: {
        street: '123 Guest St',
        city: 'Guestville',
        postalCode: '54321',
        country: 'Containerland',
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      items: guestItems,
      overrideCreatedAt: getRandomPastDateISO(),
    });

    const guestOrderRes = http.post(`${baseUrl}/orders`, guestPayload, { headers });
    check(guestOrderRes, { 'guest order 201': (r) => r.status === 201 });
  } else {
    console.log('No products available for guest order.');
  }

  sleep(1);


}
