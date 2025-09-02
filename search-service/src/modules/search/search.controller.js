// search-service/src/modules/search/search.controller.js

const { client: esClient, PRODUCT_INDEX } = require('../../config/elasticsearch');
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

const getLanguage = (req) => {
    const langHeader = req.headers['accept-language']?.split(',')[0] || 'en';
    return langHeader.substring(0, 2);
};

const localizeObject = (obj, lang, fields) => {
    if (!obj) return obj;
    const localized = { ...obj };
    for (const field of fields) {
        if (localized[field] && typeof localized[field] === 'object' && localized[field] !== null) {
            localized[field] = localized[field][lang] || localized[field]['en'];
        }
    }
    return localized;
};

const searchProducts = async (req, res, next) => {
    try {
        const lang = getLanguage(req);
        const currency = req.headers['x-currency']?.toUpperCase();

        let {
            q, category, minPrice, maxPrice, inStock, attributes,
            page = 1, limit = 24, sortBy = '_score', sortOrder = 'desc',
        } = req.query;

        const size = parseInt(limit, 10);
        const from = (parseInt(page, 10) - 1) * size;

        const mustQueries = [];
        const filterQueries = [];

        if (q) {
            mustQueries.push({
                multi_match: {
                    query: q,
                    fields: [
                        `name.${lang}^5`, `category_names_${lang}^4`, `sku^3`,
                        `description.${lang}^2`, `variant_attributes_flat^1`,
                        'name.en^2.5', 'category_names_en^2', 'description.en^1'
                    ],
                    fuzziness: "AUTO",
                    operator: "and"
                },
            });
        }

        if (inStock === 'true') {
            filterQueries.push({ nested: { path: 'variants', query: { range: { 'variants.stockQuantity': { gt: 0 } } } } });
        }

        if (category) {
            filterQueries.push({ term: { "category_slugs": category } });
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            let baseMinPrice = minPrice ? parseFloat(minPrice) : undefined;
            let baseMaxPrice = maxPrice ? parseFloat(maxPrice) : undefined;

            if (currency && currency !== 'USD') {
                try {
                    const { data: rateData } = await axios.get(`${PRODUCT_SERVICE_URL}/currencies/internal/rates/${currency}`);
                    const exchangeRate = parseFloat(rateData.rateVsBase);
                    if (baseMinPrice !== undefined) baseMinPrice /= exchangeRate;
                    if (baseMaxPrice !== undefined) baseMaxPrice /= exchangeRate;
                } catch (e) {
                    return res.status(400).json({ message: `Currency '${currency}' is not supported.` });
                }
            }
            const rangeQuery = {};
            if (baseMinPrice !== undefined) rangeQuery.gte = baseMinPrice;
            if (baseMaxPrice !== undefined) rangeQuery.lte = baseMaxPrice;

            if (Object.keys(rangeQuery).length > 0) {
                filterQueries.push({ nested: { path: "variants", query: { range: { "variants.price": rangeQuery } } } });
            }
        }

        if (attributes && typeof attributes === 'object') {
            const attributeFilters = Object.entries(attributes).map(([key, value]) => {
                const values = Array.isArray(value) ? value : [value];
                return { bool: { should: values.map(v => ({ term: { variant_attributes_flat: `${key}:${v}` } })), minimum_should_match: 1 } };
            });
            if (attributeFilters.length > 0) filterQueries.push(...attributeFilters);
        }

        const esQuery = { bool: { must: mustQueries.length > 0 ? mustQueries : { match_all: {} }, filter: filterQueries } };

        const sort = [];
        if (sortBy === 'price') {
             sort.push({ 'variants.price': { order: sortOrder, nested: { path: 'variants' } } });
        } else if (sortBy === 'createdAt') {
             sort.push({ 'createdAt': { order: sortOrder } });
        } else {
             sort.push({ [sortBy]: { order: sortOrder } });
        }

        const searchResponse = await esClient.search({
            index: PRODUCT_INDEX, from, size,
            body: {
                query: esQuery, sort,
                aggs: {
                    categories: { terms: { field: "category_slugs", size: 50 } },
                    attributes: { terms: { field: "variant_attributes_flat", size: 100 } },
                    price_ranges: {
                        nested: { path: "variants" },
                        aggs: { prices: { range: { field: "variants.price", ranges: [ { to: 50.0 }, { from: 50.0, to: 100.0 }, { from: 100.0, to: 200.0 }, { from: 200.0, to: 500.0 }, { from: 500.0 } ] } } }
                    }
                }
            },
        });

        if (!searchResponse || !searchResponse.hits) {
            throw new Error('Invalid response structure from Elasticsearch');
        }

        const totalHits = typeof searchResponse.hits.total === 'object' ? searchResponse.hits.total.value : searchResponse.hits.total;
        const results = searchResponse.hits.hits.map(hit => localizeObject(hit._source, lang, ['name', 'description']));

        const parseFacets = (aggregations) => {
            const facets = {};
            if (aggregations.categories?.buckets) {
                facets.categories = aggregations.categories.buckets.map(b => ({ slug: b.key, count: b.doc_count }));
            }
            if (aggregations.attributes?.buckets) {
                const attrs = {};
                aggregations.attributes.buckets.forEach(b => {
                    const [key, value] = b.key.split(':', 2);
                    if (!attrs[key]) attrs[key] = { name: key, options: [] };
                    attrs[key].options.push({ value, count: b.doc_count });
                });
                facets.attributes = Object.values(attrs);
            }
            if (aggregations.price_ranges?.prices?.buckets) {
                facets.price_ranges = aggregations.price_ranges.prices.buckets.map(b => ({ key: b.key, from: b.from, to: b.to, count: b.doc_count })).filter(b => b.count > 0);
            }
            return facets;
        };

        res.json({
            data: results,
            pagination: { total: totalHits, page: parseInt(page, 10), limit: size, totalPages: Math.ceil(totalHits / size) },
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