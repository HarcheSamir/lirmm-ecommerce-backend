const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const PRODUCT_INDEX = 'products';

if (!ELASTICSEARCH_NODE) {
    console.error('[Search Service] FATAL: Missing required environment variable ELASTICSEARCH_NODE');
    process.exit(1);
}

const client = new Client({
    node: ELASTICSEARCH_NODE,
    requestTimeout: 10000,
    maxRetries: 3,
    sniffOnStart: false,
    sniffOnConnectionFault: false
});

// =================================================================
// YOUR ORIGINAL, UNTOUCHED SETTINGS AND MAPPINGS OBJECT
// =================================================================
const indexSettingsAndMappings = {
    settings: {
        analysis: {
            analyzer: {
                default_analyzer: {
                    type: "standard",
                    filter: [ "lowercase", "asciifolding" ]
                }
            }
        }
    },
    mappings: {
        properties: {
            id: { type: "keyword" },
            sku: { type: "keyword" },
            name: {
                type: "text",
                analyzer: "default_analyzer",
                fields: { keyword: { type: "keyword", ignore_above: 256 } }
            },
            description: { type: "text", analyzer: "default_analyzer" },
            isActive: { type: "boolean" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
            averageRating: { type: "half_float" }, 
            reviewCount: { type: "integer" }, 
            category_names: { type: "text", analyzer: "default_analyzer" },
            category_slugs: { type: "keyword" },
            variants: {
                type: "nested",
                properties: {
                    id: { type: "keyword" },
                    price: { type: "float" },
                    stockQuantity: { type: "integer" },
                    attributes: { type: "object", enabled: false }
                }
            },
            variant_attributes_flat: { type: "keyword" },
            images: {
                type: "nested",
                properties: {
                    id: { type: "keyword" },
                    imageUrl: { type: "keyword", index: false },
                    altText: { type: "text" },
                    isPrimary: { type: "boolean" },
                    order: { type: "integer" }
                }
            },
        }
    }
};

const ensureIndexExists = async () => {
    const indexName = PRODUCT_INDEX;
    try {
        const existsResponse = await client.indices.exists({ index: indexName });
        if (!existsResponse) {
             console.log(`[Search Service] Index "${indexName}" does not exist. Creating with settings/mappings...`);
             await client.indices.create({
                 index: indexName,
                 body: indexSettingsAndMappings // Uses your full object here
             });
             console.log(`[Search Service] Index "${indexName}" created successfully.`);
        } else {
             console.log(`[Search Service] Index "${indexName}" already exists.`);
        }
    } catch (error) {
        const errorDetails = error.meta?.body?.error ? JSON.stringify(error.meta.body.error) : error.message;
        console.error(`[Search Service] Error during index check/creation for "${indexName}": ${errorDetails}`);
        // This logic correctly handles the race condition where another service creates the index between our check and our create call
        if (!(error.meta?.body?.error?.type === 'resource_already_exists_exception')) {
             throw error;
        } else {
             console.warn(`[Search Service] Caught 'resource_already_exists_exception' for "${indexName}", proceeding as index is now present.`);
        }
    }
};

const connectClient = async (maxRetries = 15, retryDelayMs = 5000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Search Service] Attempt ${attempt}/${maxRetries}: Pinging Elasticsearch at ${ELASTICSEARCH_NODE}...`);
            const isConnected = await client.ping();
            if (!isConnected) {
                 throw new Error('Elasticsearch ping returned falsy value');
            }
            console.log(`[Search Service] Elasticsearch ping successful on attempt ${attempt}.`);
            
            // Now that we're connected, ensure the index is ready
            await ensureIndexExists();
            
            console.log('[Search Service] Elasticsearch client setup complete.');
            return; // Success, exit the loop and function
        } catch (error) {
            console.error(`[Search Service] Attempt ${attempt}/${maxRetries}: Elasticsearch connection/setup failed: ${error.message}`);
            
            if (attempt === maxRetries) {
                console.error(`[Search Service] All ${maxRetries} attempts to connect to Elasticsearch failed. Giving up.`);
                throw error; // Crash the pod after the last attempt
            }
            
            console.log(`[Search Service] Retrying in ${retryDelayMs / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    }
};

module.exports = {
    client,
    connectClient,
    PRODUCT_INDEX
};