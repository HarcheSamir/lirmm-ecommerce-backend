// tests/baseline-read-test.js

import http from 'k6/http';
import { sleep, check } from 'k6';

// ==============================================================================
//  LOAD CONFIGURATION
//  This section defines the intensity and duration of the test.
// ==============================================================================
export const options = {
  // Number of concurrent virtual users to simulate.
  vus: 20, 
  // Total duration of the test.
  duration: '1m', 

  // THRESHOLDS: Define the success criteria for this test.
  // This is critical for your thesis to have measurable goals.
  thresholds: {
    // 95% of all HTTP requests must complete in under 600ms.
    'http_req_duration': ['p(95)<600'], 

    // The success rate for checks must be over 98%.
    'checks': ['rate>0.98'], 
  },
};


// ==============================================================================
//  VIRTUAL USER SCRIPT
//  This is the code that each of the 20 virtual users will execute in a loop.
// ==============================================================================
export default function () {
  const baseUrl = 'http://localhost:13000';

  // --- Step 1: User visits the main product page ---
  const productListRes = http.get(`${baseUrl}/products?page=1&limit=12`);

  // Check if the request was successful (HTTP status 200).
  check(productListRes, {
    'GET /products | status is 200': (r) => r.status === 200,
  });

  // --- Step 2: User clicks on a random product ---
  // We only proceed if the first request was successful and returned products.
  const products = productListRes.json();
  if (products && products.data && products.data.length > 0) {
    
    // Select a random product from the list returned by the API.
    const randomProduct = products.data[Math.floor(Math.random() * products.data.length)];
    const productId = randomProduct.id;

    // Make the request to view that specific product's detail page.
    const singleProductRes = http.get(`${baseUrl}/products/id/${productId}`);
    
    check(singleProductRes, {
      'GET /products/id/{id} | status is 200': (r) => r.status === 200,
    });
  }

  // --- Step 3: User "thinks" for a moment ---
  // This simulates realistic user behavior and avoids overwhelming the server unrealistically.
  sleep(2); // Wait for 2 seconds before the next user iteration.
}