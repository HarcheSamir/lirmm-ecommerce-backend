// tests/combined-workload-english.js

import { check, sleep } from 'k6';
import http from 'k6/http';

const baseUrl = 'http://localhost:13000';

// Define the standard headers for all English (US) requests.
const englishHeaders = {
  'Content-Type': 'application/json',
  'Accept-Language': 'en-US',
  'X-Currency': 'USD'
};

// ==============================================================================
//  SETUP FUNCTION
//  This runs ONCE before any VUs start. We create a pool of test users here.
// ==============================================================================
export function setup() {
  console.log('--- Seeding database with initial data ---');
  // Run initial data seeding requests
  http.post(`${baseUrl}/auth/resync-users`);
  http.post(`${baseUrl}/products/categories/bulk`);
  http.post(`${baseUrl}/products/bulk`);

  console.log('--- Setting up registered test user pool ---');
  const userPool = [];
  const userCount = 26;
  for (let i = 0; i < userCount; i++) {
    const email = `testuser${i}@loadtest.com`;
    const password = 'password';
    const letter = String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : '');
    const registerPayload = JSON.stringify({ email, password, name: `Test User ${letter}` });
    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${baseUrl}/auth/register`, registerPayload, { headers });
    if (res.status === 201) {
      userPool.push({ email, password });
    } else {
      console.log(`User ${email} might already exist. Status: ${res.status}`);
    }
  }
  console.log(`--- Created or verified ${userPool.length} users for the test ---`);
  return { users: userPool }; // This data is passed to the VU functions
}

// ==============================================================================
//  HELPER FUNCTIONS
// ==============================================================================

// MODIFIED: This function now accepts headers to make language-specific requests.
function getRandomProducts(headers, count = 1) {
  const productsToReturn = [];
  // Pass the provided headers to the GET request
  const prodRes = http.get(`${baseUrl}/products?page=1&limit=50`, { headers });
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
  } catch(e) {
    console.error(`Failed to get random products. Error: ${e}. Body: ${prodRes.body}`);
    return null;
  }
}

// Helper to generate a random past date in ISO format
function getRandomPastDateISO() {
    const now = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    const randomTimestamp = Math.random() * (now.getTime() - twoYearsAgo.getTime()) + twoYearsAgo.getTime();
    return new Date(randomTimestamp).toISOString();
}

// ==============================================================================
//  USER PERSONA LOGIC (All updated to use English headers)
// ==============================================================================

export function windowShopper() {
  // MODIFIED: Added headers to the request.
  const res = http.get(`${baseUrl}/products?page=1&limit=12`, { headers: englishHeaders });
  check(res, { 'WindowShopper: GET /products is 200': (r) => r.status === 200 });
  sleep(2);
}

export function missionCustomer() {
  const searchTerms = ['computer', 'shirt', 'monitor', 'keyboard'];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  // MODIFIED: Added headers to the request.
  const res = http.get(`${baseUrl}/search/products?q=${randomTerm}&limit=20`, { headers: englishHeaders });
  check(res, { 'MissionCustomer: GET /search is 200': (r) => r.status === 200 });
  sleep(3);
}

export function guestBuyer() {
  const itemCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 items
  // MODIFIED: Pass headers to the helper function.
  const selections = getRandomProducts(englishHeaders, itemCount);
  if (!selections || selections.length === 0) return;
  
  sleep(1);

  const orderItems = selections.map(sel => ({
    productId: sel.product.id,
    variantId: sel.variant.id,
    quantity: 1,
  }));

  const guestEmail = `guest-${__VU}-${__ITER}@test.com`;
  const orderPayload = JSON.stringify({ 
    guestName: "Guest User",
    guestEmail: guestEmail,
    phone: "555-555-5555",
    shippingAddress: { street: "123 Guest St", city: "Guestville", postalCode: "54321", country: "Containerland" },
    paymentMethod: "CASH_ON_DELIVERY",
    items: orderItems,
    overrideCreatedAt: getRandomPastDateISO()
  });

  // MODIFIED: Use the standard englishHeaders object for the POST request.
  const orderRes = http.post(`${baseUrl}/orders`, orderPayload, { headers: englishHeaders });
  check(orderRes, { 'Guest Buyer: POST /orders is 201': (r) => r.status === 201 });
}

export function registeredBuyer(data) {
  if (!data.users || data.users.length === 0) return;

  const itemCount = Math.floor(Math.random() * 3) + 1;
  // MODIFIED: Pass headers to the helper function.
  const selections = getRandomProducts(englishHeaders, itemCount);
  if (!selections || selections.length === 0) return;

  const randomUser = data.users[Math.floor(Math.random() * data.users.length)];
  const loginPayload = JSON.stringify({ email: randomUser.email, password: randomUser.password });
  
  const loginRes = http.post(`${baseUrl}/auth/login`, loginPayload, { headers: { 'Content-Type': 'application/json' } });
  if (!check(loginRes, { 'RegisteredBuyer: Step 1 - Login is 200': (r) => r.status === 200 })) return;
  
  const authToken = loginRes.json().token;
  // MODIFIED: Merge the standard English headers with the Authorization token.
  const authHeaders = { 
    ...englishHeaders, 
    'Authorization': `Bearer ${authToken}` 
  };
  
  sleep(1);

  const orderItems = selections.map(sel => ({
    productId: sel.product.id,
    variantId: sel.variant.id,
    quantity: 1,
  }));

  const orderPayload = JSON.stringify({ 
    phone: "555-555-5555",
    shippingAddress: { street: "123 Registered St", city: "Userville", postalCode: "12345", country: "Containerland" },
    paymentMethod: "CREDIT_CARD",
    items: orderItems,
    overrideCreatedAt: getRandomPastDateISO()
  });

  const orderRes = http.post(`${baseUrl}/orders`, orderPayload, { headers: authHeaders });
  check(orderRes, { 'Registered Buyer: POST /orders is 201': (r) => r.status === 201 });
}

// ==============================================================================
//  MASTER SCENARIO CONFIGURATION (Unchanged)
// ==============================================================================
export const options = {
  scenarios: {
    window_shoppers: {
      executor: 'ramping-vus',
      exec: 'windowShopper',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   
        { duration: '28m', target: 100 },  
        { duration: '1m', target: 0 },    
      ],
      gracefulRampDown: '30s',
    },
    mission_customers: {
      executor: 'ramping-vus',
      exec: 'missionCustomer',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },   
        { duration: '28m', target: 10 },  
        { duration: '1m', target: 0 },   
      ],
      gracefulRampDown: '30s',
    },
    guest_buyers: {
      executor: 'ramping-vus',
      exec: 'guestBuyer',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 }, 
        { duration: '28m', target: 25 },  
        { duration: '1m', target: 0 }, 
      ],
      gracefulRampDown: '30s',
    },
    registered_buyers: {
      executor: 'ramping-vus',
      exec: 'registeredBuyer',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '28m', target: 25 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'http_req_duration': ['p(95)<1500'],
    'checks': ['rate>0.98']
  },
};
