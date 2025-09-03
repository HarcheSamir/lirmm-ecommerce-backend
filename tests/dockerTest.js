import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = 'http://localhost:3000';

// Define possible payment methods to be chosen randomly.
const paymentMethods = ['CASH_ON_DELIVERY', 'CREDIT_CARD'];

// ==============================================================================
// SCENARIOS: Define the user contexts. Only the English scenario is needed.
// ==============================================================================
const scenarios = [
  // Only the English scenario is kept as requested.
  { lang: 'en-US', currency: 'USD', headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en-US', 'X-Currency': 'USD' } },
];

// Run with 20 virtual users for 5 minutes to simulate concurrent load.
export const options = {
  vus: 20,
  duration: '5m',
};

// ==============================================================================
// SETUP: This function prepares the test environment before the test runs.
// ==============================================================================
export function setup() {
  console.log('--- Step 1: User Sync ---');
  http.post(`${baseUrl}/auth/resync-users`);

  console.log('--- Step 2: Bulk categories ---');
  http.post(`${baseUrl}/products/categories/bulk`);

  console.log('--- Step 3: Bulk products ---');
  http.post(`${baseUrl}/products/bulk`);

  console.log('--- Setup Complete ---');
}

// ==============================================================================
// HELPERS — These functions assist the main test logic.
// ==============================================================================
function getRandomProducts(headers, count = 1) {
  const productsToReturn = [];
  // Pass headers to the GET request.
  const prodRes = http.get(`${baseUrl}/products?page=1&limit=50`, { headers });

  check(prodRes, {
    'get products returns 200': (r) => r.status === 200,
  });

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
    console.error(`Failed to parse products response: ${e}. Body: ${prodRes.body}`);
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
// DEFAULT: Main test logic, updated to run a random scenario per iteration.
// ==============================================================================
export default function (data) {
  // Step 1: Pick the English scenario.
  const scenario = scenarios[0];
  console.log(`--- VU: ${__VU}, Iter: ${__ITER} | Running scenario: lang=${scenario.lang}, currency=${scenario.currency} ---`);

  // Step 2: Create a guest order using the scenario's headers.
  const guestSelections = getRandomProducts(scenario.headers, Math.floor(Math.random() * 3) + 1);

  if (guestSelections && guestSelections.length > 0) {
    const guestItems = guestSelections.map(sel => ({
      variantId: sel.variant.id,
      quantity: 1,
    }));

    // MODIFIED: Randomly select a payment method for each order.
    const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    const guestPayload = JSON.stringify({
      guestName: 'Guest User',
      guestEmail: `test-${__VU}@gmail.com`,
      phone: '555-555-5555',
      shippingAddress: { street: '123 Guest St', city: 'Guestville', postalCode: '54321', country: 'Containerland' },
      paymentMethod: randomPaymentMethod, // Use the randomized method
      items: guestItems,
      overrideCreatedAt: getRandomPastDateISO(),
    });

    // Pass scenario headers to the POST request.
    const guestOrderRes = http.post(`${baseUrl}/orders`, guestPayload, { headers: scenario.headers });

    check(guestOrderRes, {
      'guest order created (status 201)': (r) => r.status === 201,
      'guest order response currency is correct': (r) => {
        if (r.status !== 201) return false;
        try {
          const body = r.json();
          return body && body.displayCurrency === scenario.currency;
        } catch (e) {
          return false;
        }
      },
    });
  } else {
    console.log(`VU: ${__VU} | No products found for guest order.`);
  }

  // A short pause between iterations for each virtual user.
  sleep(1);
}