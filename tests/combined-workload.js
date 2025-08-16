// tests/combined-workload.js

import { check, sleep } from 'k6';
import http from 'k6/http';

const baseUrl = 'http://localhost:3000';

// ==============================================================================
//  SETUP FUNCTION
//  This runs ONCE before any VUs start. We create a pool of test users here.
// ==============================================================================
export function setup() {
  console.log('--- Setting up registered test user pool ---');
  const userPool = [];
  const userCount = 100;
  const userSync = http.post(`${baseUrl}/auth/resync-users`) 
  const categories = http.post(`${baseUrl}/products/categories/bulk`) 
  const products = http.post(`${baseUrl}/products/bulk`)
  for (let i = 0; i < userCount; i++) {
    const email = `testuser${i}@loadtest.com`;
    const password = 'password';
    const registerPayload = JSON.stringify({ email, password, name: `Test User ${i}` });
    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${baseUrl}/auth/register`, registerPayload, { headers });
    if (res.status === 201) {
      userPool.push({ email, password });
    } else {
      console.log(`user already exists`);
    }
  }
  console.log(`--- Created ${userPool.length} users for the test ---`);
  return { users: userPool }; // This data is passed to the VU functions
}

// ==============================================================================
//  HELPER FUNCTIONS
// ==============================================================================

function getRandomProducts(count = 1) {
  const productsToReturn = [];
  // Fetch a larger list of products to ensure variety and avoid duplicates
  const prodRes = http.get(`${baseUrl}/products?page=1&limit=50`);
  if (prodRes.status !== 200 || !prodRes.body) return null;
  
  try {
    const productsData = prodRes.json().data;
    if (productsData.length === 0) return null;

    // Use a Set to ensure we don't pick the same product twice in one order
    const pickedProductIds = new Set();

    for (let i = 0; i < count; i++) {
      if (productsToReturn.length >= productsData.length) break; // Can't pick more than available

      let product;
      let attempt = 0;
      // Loop to find a product we haven't already picked for this order
      do {
        product = productsData[Math.floor(Math.random() * productsData.length)];
        attempt++;
      } while (pickedProductIds.has(product.id) && attempt < 10);

      if (pickedProductIds.has(product.id)) continue; // Skip if we couldn't find a unique one
      
      pickedProductIds.add(product.id);
      
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
        productsToReturn.push({ product, variant });
      }
    }
    return productsToReturn;
  } catch(e) { 
    return null;
  }
}

// Helper to generate a random past date in ISO format
function getRandomPastDateISO() {
    const now = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    // getTime() returns milliseconds since epoch
    const randomTimestamp = Math.random() * (now.getTime() - twoYearsAgo.getTime()) + twoYearsAgo.getTime();
    return new Date(randomTimestamp).toISOString();
}

// ==============================================================================
//  USER PERSONA LOGIC
// ==============================================================================

export function windowShopper() {
  const res = http.get(`${baseUrl}/products?page=1&limit=12`);
  check(res, { 'WindowShopper: GET /products is 200': (r) => r.status === 200 });
  sleep(2);
}

export function missionCustomer() {
  const searchTerms = ['computer', 'shirt', 'monitor', 'keyboard'];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const res = http.get(`${baseUrl}/search/products?q=${randomTerm}&limit=20`);
  check(res, { 'MissionCustomer: GET /search is 200': (r) => r.status === 200 });
  sleep(3);
}

export function guestBuyer() {
  const itemCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 items
  const selections = getRandomProducts(itemCount);
  if (!selections || selections.length === 0) return;
  
  sleep(1);

  const orderItems = selections.map(sel => ({
    productId: sel.product.id,
    variantId: sel.variant.id,
    quantity: 1, // Keep quantity at 1 for simplicity
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
  const headers = { 'Content-Type': 'application/json' };
  const orderRes = http.post(`${baseUrl}/orders`, orderPayload, { headers });
  check(orderRes, { 'Guest Buyer: POST /orders is 201': (r) => r.status === 201 });
}

export function registeredBuyer(data) {
  if (!data.users || data.users.length === 0) return;

  const itemCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 items
  const selections = getRandomProducts(itemCount);
  if (!selections || selections.length === 0) return;

  const randomUser = data.users[Math.floor(Math.random() * data.users.length)];
  const loginPayload = JSON.stringify({ email: randomUser.email, password: randomUser.password });
  const headers = { 'Content-Type': 'application/json' };
  
  const loginRes = http.post(`${baseUrl}/auth/login`, loginPayload, { headers });
  if (!check(loginRes, { 'RegisteredBuyer: Step 1 - Login is 200': (r) => r.status === 200 })) return;
  
  const authToken = loginRes.json().token;
  const authHeaders = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
  
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
//  MASTER SCENARIO CONFIGURATION
// ==============================================================================
export const options = {
  scenarios: {
    window_shoppers: {
      executor: 'ramping-vus',
      exec: 'windowShopper',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    mission_customers: {
      executor: 'ramping-vus',
      exec: 'missionCustomer',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    guest_buyers: {
      executor: 'ramping-vus',
      exec: 'guestBuyer',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    registered_buyers: {
      executor: 'ramping-vus',
      exec: 'registeredBuyer',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
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