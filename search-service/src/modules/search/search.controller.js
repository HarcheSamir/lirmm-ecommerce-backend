const { client: esClient, PRODUCT_INDEX } = require('../../config/elasticsearch');

const searchProducts = async (req, res, next) => {
    try {
        const {
            q,
            category,
            minPrice,
            maxPrice,
            inStock,
            attributes,
            page = 1,
            limit = 24,
            sortBy = '_score',
            sortOrder = 'desc',
        } = req.query;

        const size = parseInt(limit, 10);
        const from = (parseInt(page, 10) - 1) * size;

        const mustQueries = [];
        const filterQueries = [];

        if (q) {
            mustQueries.push({
                multi_match: {
                    query: q,
                    fields: ['name^4', 'sku^3', 'description^1', 'category_names^2', 'variant_attributes_flat^1'],
                    fuzziness: "AUTO",
                    operator: "and"
                },
            });
        }

        if (inStock === 'true') {
            filterQueries.push({
                nested: {
                    path: 'variants',
                    query: {
                        range: { 'variants.stockQuantity': { gt: 0 } }
                    }
                }
            });
        }

        if (category) {
            filterQueries.push({
                term: { "category_slugs": category }
            });
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const rangeQuery = {};
            if (minPrice !== undefined) rangeQuery.gte = parseFloat(minPrice);
            if (maxPrice !== undefined) rangeQuery.lte = parseFloat(maxPrice);

            if (Object.keys(rangeQuery).length > 0) {
                filterQueries.push({
                    nested: {
                        path: "variants",
                        query: {
                            range: { "variants.price": rangeQuery }
                        }
                    }
                });
            }
        }

        if (attributes && typeof attributes === 'object') {
            const attributeFilters = Object.entries(attributes).map(([key, value]) => {
                const values = Array.isArray(value) ? value : [value];
                return {
                    bool: {
                        should: values.map(v => ({
                            term: {
                                variant_attributes_flat: `${key}:${v}`
                            }
                        })),
                        minimum_should_match: 1
                    }
                };
            });
            if (attributeFilters.length > 0) {
                filterQueries.push(...attributeFilters);
            }
        }

        const esQuery = {
            bool: {
                must: mustQueries.length > 0 ? mustQueries : { match_all: {} },
                filter: filterQueries
            }
        };

        const sort = [];
        if (sortBy === 'price') {
             sort.push({ 'variants.price': { order: sortOrder, nested: { path: 'variants' } } });
        } else if (sortBy === 'createdAt') {
             sort.push({ 'createdAt': { order: sortOrder } });
        } else {
             sort.push({ [sortBy]: { order: sortOrder } });
        }


        const searchResponse = await esClient.search({
            index: PRODUCT_INDEX,
            from: from,
            size: size,
            body: {
                query: esQuery,
                sort: sort,
                aggs: {
                    categories: {
                        terms: { field: "category_slugs", size: 50 }
                    },
                    attributes: {
                        terms: { field: "variant_attributes_flat", size: 100 }
                    },
                    price_ranges: {
                        nested: {
                            path: "variants"
                        },
                        aggs: {
                            prices: {
                                range: {
                                    field: "variants.price",
                                    ranges: [
                                        { to: 50.0 },
                                        { from: 50.0, to: 100.0 },
                                        { from: 100.0, to: 200.0 },
                                        { from: 200.0, to: 500.0 },
                                        { from: 500.0 }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!searchResponse || !searchResponse.hits) {
            console.error('Elasticsearch search response is missing expected "hits" property:', searchResponse);
            throw new Error('Invalid response structure from Elasticsearch');
        }

        const totalHits = typeof searchResponse.hits.total === 'object' ? searchResponse.hits.total.value : searchResponse.hits.total;
        const results = searchResponse.hits.hits.map(hit => hit._source);

        const parseFacets = (aggregations) => {
            const facets = {};
            if (aggregations.categories?.buckets) {
                facets.categories = aggregations.categories.buckets.map(bucket => ({
                    slug: bucket.key,
                    count: bucket.doc_count
                }));
            }
            if (aggregations.attributes?.buckets) {
                const attrs = {};
                aggregations.attributes.buckets.forEach(bucket => {
                    const [key, value] = bucket.key.split(':', 2);
                    if (!attrs[key]) {
                        attrs[key] = { name: key, options: [] };
                    }
                    attrs[key].options.push({ value: value, count: bucket.doc_count });
                });
                facets.attributes = Object.values(attrs);
            }
            if (aggregations.price_ranges?.prices?.buckets) {
                facets.price_ranges = aggregations.price_ranges.prices.buckets.map(bucket => ({
                    key: bucket.key,
                    from: bucket.from,
                    to: bucket.to,
                    count: bucket.doc_count
                })).filter(b => b.count > 0);
            }
            return facets;
        };

        res.json({
            data: results,
            pagination: {
                total: totalHits,
                page: parseInt(page, 10),
                limit: size,
                totalPages: Math.ceil(totalHits / size),
            },
            facets: parseFacets(searchResponse.aggregations)
        });

    } catch (err) {
        console.error("Error during product search execution:", err.message);
        if (err.meta && err.meta.body) {
            console.error("Elasticsearch Client Error Body:", JSON.stringify(err.meta.body, null, 2));
        }
        const statusCode = (err.meta && err.meta.statusCode) ? err.meta.statusCode : 500;
        const clientError = new Error('An error occurred while searching for products.');
        clientError.statusCode = statusCode;
        next(clientError);
    }
};

module.exports = { searchProducts };