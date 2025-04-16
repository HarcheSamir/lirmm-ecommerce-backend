const { client: esClient, PRODUCT_INDEX } = require('../../config/elasticsearch'); // Use PRODUCT_INDEX

// Renamed function to reflect searching products
const searchProducts = async (req, res, next) => {
    try {
        const { q, limit = 10, page = 1, category, isActive, minPrice, maxPrice /* Add other filters */ } = req.query;

        // Require at least one query parameter or filter to initiate search
        if (!q && !category && isActive === undefined && minPrice === undefined && maxPrice === undefined) {
            return res.status(400).json({ message: 'Search query parameter "q" or other filter (category, isActive, price range) is required' });
        }

        const size = parseInt(limit, 10);
        const from = (parseInt(page, 10) - 1) * size;

        console.log(`Searching index "${PRODUCT_INDEX}" - q: "${q || '*'}", category: "${category || 'N/A'}", page: ${page}, limit: ${size}`);

        // --- Build Elasticsearch Query ---
        const mustQueries = []; // Conditions that MUST match (for scoring)
        const filterQueries = []; // Conditions that MUST match (non-scoring, cached)

        // Text search query (if 'q' is provided)
        if (q) {
            mustQueries.push({
                multi_match: {
                    query: q,
                    // Fields to search in (adjust fields and boosts '^' as needed)
                    fields: ['name^4', 'sku^3', 'description^1', 'category_names^2', 'variant_attributes_flat^1'],
                    fuzziness: "AUTO", // Allows for some typos
                    operator: "and" // Require all terms in 'q' to match in at least one field
                },
            });
        }

        // Filters (add conditions to filterQueries)
        if (isActive !== undefined) {
            filterQueries.push({
                term: { isActive: isActive === 'true' } // Exact boolean match
            });
        }
        if (category) { // Filter by category slug (using nested query)
            filterQueries.push({
                nested: {
                    path: "categories", // The nested field path
                    query: {
                        term: { "categories.slug": category } // Exact match on category slug
                    }
                }
            });
        }
         if (minPrice !== undefined || maxPrice !== undefined) { // Filter by variant price range (nested)
             const rangeQuery = {};
             if (minPrice !== undefined) rangeQuery.gte = parseFloat(minPrice); // Greater than or equal
             if (maxPrice !== undefined) rangeQuery.lte = parseFloat(maxPrice); // Less than or equal

             // Ensure rangeQuery is not empty if one limit is missing
             if (Object.keys(rangeQuery).length > 0) {
                filterQueries.push({
                    nested: {
                         path: "variants", // The nested field path
                         query: {
                             range: { "variants.price": rangeQuery } // Range query on variant price
                         }
                    }
                });
             } else {
                 console.warn("Price range filter specified but minPrice/maxPrice resulted in empty range.");
             }
         }
         // Add more filters here (e.g., specific variant attributes like color/size)
         // Example: Filter by color attribute within variants
         // if (req.query.color) {
         //    filterQueries.push({
         //       nested: {
         //          path: "variants",
         //          query: { term: { "variants.attributes.color.keyword": req.query.color } } // Requires explicit mapping for attributes.color.keyword
         //       }
         //    })
         // }

        // Combine text query and filters using a bool query
        const esQuery = {
            bool: {
                // Use must if 'q' exists, otherwise match all (filtered results)
                must: mustQueries.length > 0 ? mustQueries : { match_all: {} },
                filter: filterQueries // Apply all non-scoring filters
            }
        };
        // --- End Build Elasticsearch Query ---


        // Execute the search
        const searchResponse = await esClient.search({
            index: PRODUCT_INDEX, // Target the products index
            from: from,
            size: size,
            body: {
                query: esQuery,
                 // Add sorting, aggregations (facets) here if needed
                // sort: [ { "updatedAt": { "order": "desc" } } ],
                // aggs: { ... }
            },
        });

        // Basic validation of response structure
        if (!searchResponse || !searchResponse.hits) {
            console.error('Elasticsearch search response is missing expected "hits" property:', searchResponse);
             if (searchResponse?.error) {
                 console.error('Elasticsearch reported an error within the response:', searchResponse.error);
                 throw new Error(`Elasticsearch error: ${searchResponse.error.type || 'Unknown'} - ${searchResponse.error.reason || 'Unknown'}`);
             }
            throw new Error('Invalid response structure from Elasticsearch');
        }

        // Extract total hits and results
        const totalHits = typeof searchResponse.hits.total === 'object' ? searchResponse.hits.total.value : searchResponse.hits.total; // Handle ES version differences
        const results = searchResponse.hits.hits.map(hit => hit._source); // Get the actual product documents

        // Send response
        res.json({
            data: results,
            pagination: {
                total: totalHits,
                page: parseInt(page, 10),
                limit: size,
                totalPages: Math.ceil(totalHits / size),
            },
            // Include aggregation results here if aggs were used
            // facets: searchResponse.aggregations
        });

    } catch (err) {
        console.error("Error during product search execution:", err.message);
        if (err.meta && err.meta.body) { // Log ES error details if available
            console.error("Elasticsearch Client Error Body:", JSON.stringify(err.meta.body, null, 2));
        }
        console.error("Stack Trace:", err.stack);

        // Determine status code from ES error or default to 500
        const statusCode = (err.meta && err.meta.statusCode) ? err.meta.statusCode : 500;
        // Create a generic error to send to the client
        const clientError = new Error('An error occurred while searching for products.');
        clientError.statusCode = statusCode;
        next(clientError); // Pass to global error handler
    }
};

module.exports = { searchProducts }; // Export the renamed function