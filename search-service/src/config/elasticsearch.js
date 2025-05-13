// search-service/src/config/elasticsearch.js

const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const PRODUCT_INDEX = 'products'; // Index Name for Products

if (!ELASTICSEARCH_NODE) {
    // Log to stderr and exit is more appropriate for critical config issues
    console.error('[Search Service] FATAL: Missing required environment variable ELASTICSEARCH_NODE');
    process.exit(1); // Exit immediately if essential config is missing
}

const client = new Client({
    node: ELASTICSEARCH_NODE,
    requestTimeout: 10000, // Increased default timeout for ES requests
    maxRetries: 3, // Configure internal request retries for the client itself
    sniffOnStart: false, // Typically false for single-node setups
    sniffOnConnectionFault: false // Disable sniffing on fault as well for stability in dev
});

// --- Define Product Index Settings and Mappings ---
// Ensure these mappings match the data being indexed by the Kafka consumer
const indexSettingsAndMappings = {
    settings: {
        analysis: {
            analyzer: {
                default_analyzer: { // Simple analyzer example
                    type: "standard",
                    filter: [ "lowercase", "asciifolding" ]
                }
            }
        }
    },
    mappings: {
        properties: {
            // Ensure these fields match the KafkaPayload structure from product-service
            id: { type: "keyword" },
            sku: { type: "keyword" },
            name: {
                type: "text",
                analyzer: "default_analyzer", // Use defined analyzer
                fields: { keyword: { type: "keyword", ignore_above: 256 } } // For exact matches/sorting
            },
            description: { type: "text", analyzer: "default_analyzer" },
            isActive: { type: "boolean" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
            category_names: { type: "text", analyzer: "default_analyzer" },
            category_slugs: { type: "keyword" }, // Use keyword for filtering by exact slug
            variants: { // Nested type for variants array
                type: "nested",
                properties: {
                    id: { type: "keyword" },
                    price: { type: "float" },
                    stockQuantity: { type: "integer" },
                    // If you need to search within attributes, map them explicitly
                    // otherwise 'object' or 'flattened' type might be sufficient.
                    attributes: { type: "object", enabled: false } // Defaulting to not indexed unless needed
                }
            },
             // Flattened attributes for simple keyword search/filtering (e.g., "color:Red")
            variant_attributes_flat: { type: "keyword" },
             // URL, often not indexed or use keyword if filtering/aggregating by URL is needed
            primaryImageUrl: { type: "keyword", index: false },
        }
    }
};
// --- End Product Index Settings ---


// --- Function to ensure the index exists (IDEMPOTENT) ---
const ensureIndexExists = async () => {
    const indexName = PRODUCT_INDEX;
    try {
        // console.log(`[Search Service] Checking if index "${indexName}" exists...`); // Reduce verbosity
        // Use indices.exists API call
        const existsResponse = await client.indices.exists({ index: indexName });

        if (!existsResponse) { // Check the boolean response directly
             console.log(`[Search Service] Index "${indexName}" does not exist. Creating with settings/mappings...`);
             await client.indices.create({
                 index: indexName,
                 body: indexSettingsAndMappings // Use body for settings/mappings as per client docs
             });
             console.log(`[Search Service] Index "${indexName}" created successfully.`);
        } else {
             // console.log(`[Search Service] Index "${indexName}" already exists.`); // Reduce verbosity
             // Optional: Add logic here to check/update mappings if necessary using putMapping API
             // Note: Updating mappings might require reindexing for certain changes.
             // Example: await client.indices.putMapping({ index: indexName, body: indexSettingsAndMappings.mappings });
        }

    } catch (error) {
        // Log specific details if available in the error meta
        const errorDetails = error.meta?.body?.error ? JSON.stringify(error.meta.body.error) : error.message;
        console.error(`[Search Service] Error during index check/creation for "${indexName}": ${errorDetails}`);

        // Don't exit on 'resource_already_exists_exception', could be race condition
        if (!(error.meta?.body?.error?.type === 'resource_already_exists_exception')) {
             throw error; // Re-throw other critical errors
        } else {
             console.warn(`[Search Service] Caught 'resource_already_exists_exception' during index creation attempt for "${indexName}", proceeding.`);
        }
    }
};


// --- MODIFIED Function to connect and check status with RETRY LOGIC ---
const connectClient = async (maxRetries = 5, retryDelayMs = 5000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Search Service] Attempt ${attempt}/${maxRetries}: Pinging Elasticsearch at ${ELASTICSEARCH_NODE}...`);
            // Ping the cluster - throws an error on failure
            const isConnected = await client.ping();

            // Client docs suggest ping throws error, but defensively check return if behavior changes
            if (!isConnected) {
                 throw new Error('Elasticsearch ping returned falsy value');
             }

            console.log(`[Search Service] Elasticsearch ping successful on attempt ${attempt}.`);

            // After successful ping, ensure index exists
            console.log(`[Search Service] Ensuring index "${PRODUCT_INDEX}" exists...`);
            await ensureIndexExists(); // Can throw error if index creation fails critically

            console.log('[Search Service] Elasticsearch client setup complete (ping successful, index check/creation attempted).');
            return; // SUCCESS: Exit function

        } catch (error) {
            // Check if the error is a connection refusal or timeout
            const isRetryableNetworkError =
                 error.message?.includes('ECONNREFUSED') ||
                 error.message?.includes('ETIMEDOUT') ||
                 error.constructor?.name === 'ConnectionError' || // Generic connection error
                 error.constructor?.name === 'TimeoutError';      // Specific timeout error

            const errorMessage = error.message || 'Unknown Elasticsearch connection error';
            console.error(`[Search Service] Attempt ${attempt}/${maxRetries}: Elasticsearch connection/setup failed: ${errorMessage}`);
             // Optionally log stack trace for detailed debugging: console.error(error.stack);

            if (attempt === maxRetries) {
                console.error(`[Search Service] All ${maxRetries} attempts to connect to Elasticsearch failed. Giving up.`);
                throw error; // Re-throw the last error to stop service startup gracefully
            }

            // Decide if retry is appropriate based on error type
            // Only retry known network/timeout issues. Stop on auth errors, bad requests etc.
             if (!isRetryableNetworkError) {
                 console.warn('[Search Service] Elasticsearch error does not seem transient. Stopping retry attempts.');
                 throw error; // Stop retrying for non-network errors
             }

            console.log(`[Search Service] Retrying Elasticsearch connection in ${retryDelayMs / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelayMs)); // Wait before next attempt
        }
    }
};
// --- END MODIFIED FUNCTION ---


module.exports = {
    client,
    connectClient, // Export the resilient connection function
    PRODUCT_INDEX
};