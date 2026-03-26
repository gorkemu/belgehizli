// backend/utils/filterUtils.js
const mongoose = require('mongoose');

const buildMongoFilters = (queryParams, resourceSchemaFields = {}) => {
    const finalMongoFilters = {};

    for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
            const filterValue = queryParams[key];
            if (typeof filterValue === 'string' && filterValue.trim() === '') {
                continue;
            }

            let actualKey = key;
            let operation = 'exact_match';

            if (key.endsWith('_like')) {
                actualKey = key.slice(0, -5);
                operation = 'like';
            } else if (key.endsWith('_gte')) {
                actualKey = key.slice(0, -4); 
                operation = 'gte';
            } else if (key.endsWith('_lte')) {
                actualKey = key.slice(0, -4); 
                operation = 'lte';
            } else if (key === 'q') {
                operation = 'q_search';
            }

            const fieldTypeHandler = resourceSchemaFields[actualKey] || 'exact_match';

            switch (operation) {
                case 'like':
                    if (typeof filterValue === 'string') {
                        finalMongoFilters[actualKey] = { $regex: filterValue, $options: 'i' };
                    }
                    break;
                case 'gte':
                    if (fieldTypeHandler === 'date_range') {
                        const date = new Date(filterValue);
                        if (!isNaN(date.getTime())) {
                            date.setHours(0, 0, 0, 0);
                            if (!finalMongoFilters[actualKey]) finalMongoFilters[actualKey] = {};
                            finalMongoFilters[actualKey].$gte = date;
                        }
                    } else if (fieldTypeHandler === 'number_range') {
                        const num = parseFloat(filterValue);
                        if (!isNaN(num)) {
                            if (!finalMongoFilters[actualKey]) finalMongoFilters[actualKey] = {};
                            finalMongoFilters[actualKey].$gte = num;
                        }
                    } else {
                        finalMongoFilters[actualKey] = { $gte: filterValue };
                    }
                    break;
                case 'lte':
                    if (fieldTypeHandler === 'date_range') {
                        const date = new Date(filterValue);
                        if (!isNaN(date.getTime())) {
                            date.setHours(23, 59, 59, 999);
                            if (!finalMongoFilters[actualKey]) finalMongoFilters[actualKey] = {};
                            finalMongoFilters[actualKey].$lte = date;
                        }
                    } else if (fieldTypeHandler === 'number_range') {
                        const num = parseFloat(filterValue);
                        if (!isNaN(num)) {
                            if (!finalMongoFilters[actualKey]) finalMongoFilters[actualKey] = {};
                            finalMongoFilters[actualKey].$lte = num;
                        }
                    } else {
                        finalMongoFilters[actualKey] = { $lte: filterValue };
                    }
                    break;
                case 'q_search':
                    if (typeof filterValue === 'string') {
                        const searchQuery = { $regex: filterValue, $options: 'i' };
                        const searchFields = resourceSchemaFields.q_fields || [];
                        if (searchFields.length > 0) {
                            finalMongoFilters.$or = searchFields.map(field => ({ [field]: searchQuery }));
                        }
                    }
                    break;
                case 'exact_match':
                default:
                    if (fieldTypeHandler === 'objectId') {
                        if (mongoose.Types.ObjectId.isValid(filterValue)) {
                            finalMongoFilters[actualKey] = new mongoose.Types.ObjectId(filterValue);
                        }
                    } else if (fieldTypeHandler === 'boolean') {
                        if (filterValue === 'true') finalMongoFilters[actualKey] = true;
                        else if (filterValue === 'false') finalMongoFilters[actualKey] = false;
                    } else {
                        finalMongoFilters[actualKey] = filterValue;
                    }
                    break;
            }
        }
    }
    return finalMongoFilters;
};

module.exports = { buildMongoFilters };