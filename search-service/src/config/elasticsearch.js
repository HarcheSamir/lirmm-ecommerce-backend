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
                 body: indexSettingsAndMappings
             });
             console.log(`[Search Service] Index "${indexName}" created successfully.`);
        }
    } catch (error) {
        const errorDetails = error.meta?.body?.error ? JSON.stringify(error.meta.body.error) : error.message;
        console.error(`[Search Service] Error during index check/creation for "${indexName}": ${errorDetails}`);
        if (!(error.meta?.body?.error?.type === 'resource_already_exists_exception')) {
             throw error;
        } else {
             console.warn(`[Search Service] Caught 'resource_already_exists_exception' for "${indexName}", proceeding.`);
        }
    }
};

const connectClient = async (maxRetries = 5, retryDelayMs = 5000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Search Service] Attempt ${attempt}/${maxRetries}: Pinging Elasticsearch at ${ELASTICSEARCH_NODE}...`);
            const isConnected = await client.ping();
            if (!isConnected) {
                 throw new Error('Elasticsearch ping returned falsy value');
             }
            console.log(`[Search Service] Elasticsearch ping successful on attempt ${attempt}.`);
            await ensureIndexExists();
            console.log('[Search Service] Elasticsearch client setup complete.');
            return;
        } catch (error) {
            const isRetryableNetworkError =
                 error.message?.includes('ECONNREFUSED') ||
                 error.message?.includes('ETIMEDOUT') ||
                 error.constructor?.name === 'ConnectionError' ||
                 error.constructor?.name === 'TimeoutError';
            const errorMessage = error.message || 'Unknown Elasticsearch connection error';
            console.error(`[Search Service] Attempt ${attempt}/${maxRetries}: Elasticsearch connection/setup failed: ${errorMessage}`);
            if (attempt === maxRetries) {
                console.error(`[Search Service] All ${maxRetries} attempts to connect to Elasticsearch failed. Giving up.`);
                throw error;
            }
             if (!isRetryableNetworkError) {
                 console.warn('[Search Service] Elasticsearch error does not seem transient. Stopping retry attempts.');
                 throw error;
             }
            console.log(`[Search Service] Retrying Elasticsearch connection in ${retryDelayMs / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    }
};

module.exports = {
    client,
    connectClient,
    PRODUCT_INDEX
};