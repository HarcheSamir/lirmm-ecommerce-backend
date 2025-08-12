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
            category_slugs: { type: "keyword" }, // This is the critical line
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

// =================================================================
// THIS IS THE NEW, MORE ROBUST FUNCTION
// It will DELETE the index if it exists to guarantee the mapping is correct.
// =================================================================
const ensureIndexIsCorrect = async () => {
    const indexName = PRODUCT_INDEX;
    console.log(`[Search Service] Ensuring index "${indexName}" has the correct mapping...`);
    
    try {
        const existsResponse = await client.indices.exists({ index: indexName });

        if (existsResponse) {
            console.log(`[Search Service] Index "${indexName}" exists. Deleting to ensure correct mapping.`);
            await client.indices.delete({ index: indexName });
            console.log(`[Search Service] Index "${indexName}" deleted.`);
        }

        console.log(`[Search Service] Creating index "${indexName}" with an up-to-date mapping...`);
        await client.indices.create({
            index: indexName,
            body: indexSettingsAndMappings
        });
        console.log(`[Search Service] Index "${indexName}" created successfully.`);

    } catch (error) {
        const errorDetails = error.meta?.body?.error ? JSON.stringify(error.meta.body.error) : error.message;
        console.error(`[Search Service] CRITICAL: Error during index recreation for "${indexName}": ${errorDetails}`);
        // If we fail here, the service is in a bad state, so we should crash.
        throw error;
    }
};

const connectClient = async (maxRetries = 15, retryDelayMs = 5000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Search Service] Attempt ${attempt}/${maxRetries}: Pinging Elasticsearch at ${ELASTICSEARCH_NODE}...`);
            await client.ping();
            console.log(`[Search Service] Elasticsearch ping successful on attempt ${attempt}.`);
            
            // Now that we're connected, forcibly create the index with the correct mapping.
            await ensureIndexIsCorrect();
            
            console.log('[Search Service] Elasticsearch client setup complete.');
            return; // Success
        } catch (error) {
            console.error(`[Search Service] Attempt ${attempt}/${maxRetries}: Connection/setup failed: ${error.message}`);
            if (attempt === maxRetries) {
                console.error(`[Search Service] All ${maxRetries} attempts failed. Giving up.`);
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