// jest.config.js
module.exports = {
    testEnvironment: 'node', // Use the Node.js environment for backend tests
    verbose: true, // Show detailed output for each test
    detectOpenHandles: true, // Help detect asynchronous operations not stopped
    forceExit: true, // Force Jest to exit after tests run (useful if handles are open)
    testTimeout: 10000, // Increase timeout for potentially slow operations (like service startup in tests)
    // Optional: Specify test file pattern if needed (default is fine)
    // testMatch: ['**/__tests__/**/*.test.js?(x)'],
    // Optional: Clear mocks between tests
    clearMocks: true,
    // Optional: Setup file to run before tests (e.g., for environment setup)
    // setupFilesAfterEnv: ['./jest.setup.js'],
  };