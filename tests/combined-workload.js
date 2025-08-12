// tests/combined-workload.js

import { check, sleep } from 'k6';
import http from 'k6/http';

const baseUrl = 'http://localhost:13000';

// ==============================================================================
//  SETUP FUNCTION
// ==============================================================================
export function setup() {
  console.log('--- Setting up registered test user pool ---');
  const userPool = [];
  const userCount = 20;

  for (let i = 0; i < userCount; i++) {
    const email = `testuser${i}@loadtest.com`;
    const password = 'password123';
    const registerPayload = JSON.stringify({ email, password, name: `Test User ${i}` });
    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${baseUrl}/auth/register`, registerPayload, { headers });
    if (res.status === 201) {
      userPool.push({ email, password });
    }
  }
  console.log(`--- Created ${userPool.length} users for the test ---`);
  return { users: userPool };
}

// ==============================================================================
//  HELPER FUNCTION TO SELECT A RANDOM PRODUCT
// ==============================================================================
function getRandomProduct() {
  // Fetch a page of 20 products to choose from.
  const prodRes = http.get(`${baseUrl}/products?page=1&limit=20`);
  if (prodRes.status !== 200 || !prodRes.body) return null;
  
  try {
    const productsData = prodRes.json().data;
    if (productsData.length === 0) return null;

    // Pick a random product from the list.
    const product = productsData[Math.floor(Math.random() * productsData.length)];

    // Ensure the chosen product has variants we can buy.
    if (product.variants && product.variants.length > 0) {
      // Pick a random variant of that product.
      const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
      return { product, variant };
    }
    return null;
  } catch(e) { 
    return null;
  }
}


// ==============================================================================
//  USER PERSONA LOGIC
// ==============================================================================

export function windowShopper() {
  http.get(`${baseUrl}/products?page=1&limit=12`);
  sleep(2);
}

export function missionCustomer() {
  const searchTerms = ['computer', 'shirt', 'monitor', 'keyboard'];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  http.get(`${baseUrl}/search/products?q=${randomTerm}&limit=20`);
  sleep(3);
}

export function guestBuyer() {
  const selection = getRandomProduct();
  if (!selection) return;
  const { product, variant } = selection;
  
  sleep(1);

  const guestEmail = `guest-${__VU}-${__ITER}@test.com`;
  const orderPayload = JSON.stringify({ 
    guestName: "Guest User",
    guestEmail: guestEmail,
    phone: "555-555-5555",
    shippingAddress: { street: "123 Guest St", city: "Guestville", postalCode: "54321", country: "Containerland" },
    paymentMethod: "CASH_ON_DELIVERY",
    items: [{ productId: product.id, variantId: variant.id, quantity: 1, price: variant.price }]
  });
  const headers = { 'Content-Type': 'application/json' };
  const orderRes = http.post(`${baseUrl}/orders`, orderPayload, { headers });
  check(orderRes, { 'Guest Buyer: POST /orders | status is 201': (r) => r.status === 201 });
}

export function registeredBuyer(data) {
  if (!data.users || data.users.length === 0) return;

  const selection = getRandomProduct();
  if (!selection) return;
  const { product, variant } = selection;

  const randomUser = data.users[Math.floor(Math.random() * data.users.length)];
  const loginPayload = JSON.stringify({ email: randomUser.email, password: randomUser.password });
  const headers = { 'Content-Type': 'application/json' };
  
  const loginRes = http.post(`${baseUrl}/auth/login`, loginPayload, { headers });
  if (loginRes.status !== 200 || !loginRes.body) return;
  
  const authToken = loginRes.json().token;
  const authHeaders = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
  
  sleep(1);

  const orderPayload = JSON.stringify({ 
    phone: "555-555-5555",
    shippingAddress: { street: "123 Registered St", city: "Userville", postalCode: "12345", country: "Containerland" },
    paymentMethod: "CREDIT_CARD",
    items: [{ productId: product.id, variantId: variant.id, quantity: 1, price: variant.price }]
  });

  const orderRes = http.post(`${baseUrl}/orders`, orderPayload, { headers: authHeaders });
  check(orderRes, { 'Registered Buyer: POST /orders | status is 201': (r) => r.status === 201 });
}

// ==============================================================================
//  MASTER SCENARIO CONFIGURATION
// ==============================================================================
export const options = {
  scenarios: {
    window_shoppers: {
      executor: 'ramping-vus', exec: 'windowShopper',
      startVUs: 0, stages: [ { duration: '30s', target: 40 }, { duration: '2m', target: 40 }, { duration: '30s', target: 0 } ],
    },
    mission_customers: {
      executor: 'ramping-vus', exec: 'missionCustomer',
      startVUs: 0, stages: [ { duration: '30s', target: 15 }, { duration: '2m', target: 15 }, { duration: '30s', target: 0 } ],
    },
    guest_buyers: {
      executor: 'ramping-vus', exec: 'guestBuyer',
      startVUs: 0, stages: [ { duration: '30s', target: 3 }, { duration: '2m', target: 3 }, { duration: '30s', target: 0 } ],
    },
    registered_buyers: {
      executor: 'ramping-vus', exec: 'registeredBuyer',
      startVUs: 0, stages: [ { duration: '30s', target: 2 }, { duration: '2m', target: 2 }, { duration: '30s', target: 0 } ],
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.02'],
    'http_req_duration': ['p(95)<1500'],
    'checks': ['rate>0.98']
  },
};
