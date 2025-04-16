// search-service/src/config/elasticsearch.js

const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const PRODUCT_INDEX = 'products'; // Index Name for Products

if (!ELASTICSEARCH_NODE) {
    console.error('FATAL: Missing required environment variable ELASTICSEARCH_NODE');
    process.exit(1);
}

const client = new Client({
    node: ELASTICSEARCH_NODE,
    requestTimeout: 5000
});

// --- Define Product Index Settings and Mappings ---
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
                    attributes: { type: "object", enabled: false } // Keep enabled: false unless searching specific sub-fields
                }
            },
            variant_attributes_flat: { type: "keyword" }, // For filtering like "color:Red"
            primaryImageUrl: { type: "keyword", index: false },
        }
    }
};
// --- End Product Index Settings ---


// --- Function to ensure the index exists (IDEMPOTENT) --- // <<< RESTORED/ENSURED DEFINITION
const ensureIndexExists = async () => {
    const indexName = PRODUCT_INDEX;
    try {
        console.log(`Checking if index "${indexName}" exists...`);
        const indexExists = await client.indices.exists({ index: indexName });

        if (!indexExists) {
             console.log(`Index "${indexName}" does not exist. Creating with settings/mappings...`);
             await client.indices.create({
                 index: indexName,
                 body: indexSettingsAndMappings // Use body for settings/mappings
             });
             console.log(`Index "${indexName}" created successfully.`);
        } else {
             console.log(`Index "${indexName}" already exists.`);
             // Optional: Add logic here to check/update mappings if necessary using putMapping API
             // await client.indices.putMapping({ index: indexName, body: indexSettingsAndMappings.mappings });
             // Be careful with mapping updates, some changes require reindexing.
        }

    } catch (error) {
        console.error(`Error during index check/creation for "${indexName}":`, error.message || error);
        if (error.meta && error.meta.body) {
            console.error("Elasticsearch Error Body:", JSON.stringify(error.meta.body, null, 2));
       }
        // Don't re-throw the 'resource_already_exists_exception' if create was attempted somehow
        if (!(error.meta?.body?.error?.type === 'resource_already_exists_exception')) {
             throw error; // Re-throw other critical errors
        } else {
             console.warn(`Caught 'resource_already_exists_exception' despite check for index "${indexName}", proceeding.`);
        }
    }
};


// --- Function to connect and check status --- // <<< RESTORED/ENSURED DEFINITION
const connectClient = async () => {
    try {
        await client.ping();
        console.log('Elasticsearch client ping successful.');
        // Call ensureIndexExists AFTER successful ping
        await ensureIndexExists();
        console.log('Elasticsearch client setup complete (ping successful, index check/creation attempted).');
    } catch (error) {
        console.error('Elasticsearch client connection or index setup failed:', error);
        // If ensureIndexExists throws a critical error, it will be caught here
        throw error; // Propagate error to stop startup if connection/setup fails critically
    }
};
// --- END RESTORED FUNCTIONS ---


module.exports = {
    client,
    connectClient,  // <<< Now correctly defined above before being exported
    PRODUCT_INDEX
};