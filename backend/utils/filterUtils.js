// backend/utils/filterUtils.js
const mongoose = require('mongoose');

const buildMongoFilters = (queryParams, resourceSchemaFields = {}) => {
    const finalMongoFilters = {};

    for (const key in queryParams) {
        if (queryParams.hasOwnProperty(key)) {
            const filterValue = queryParams[key];
            // Boş string filtrelerini en başta atla
            if (typeof filterValue === 'string' && filterValue.trim() === '') {
                continue;
            }

            let actualKey = key; // Varsayılan olarak anahtarın kendisi
            let operation = 'exact_match'; // Varsayılan işlem

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
            // Diğer özel son ekler (_ne, _gt, _lt vb.) buraya eklenebilir.

            // Alan tipi/işleyicisini actualKey'e göre al
            const fieldTypeHandler = resourceSchemaFields[actualKey] || 'exact_match'; // Varsayılan exact_match

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
                    } else if (fieldTypeHandler === 'number_range') { // number_range diye bir tip tanımlamadık ama olabilir
                        const num = parseFloat(filterValue);
                        if (!isNaN(num)) {
                            if (!finalMongoFilters[actualKey]) finalMongoFilters[actualKey] = {};
                            finalMongoFilters[actualKey].$gte = num;
                        }
                    } else { // Varsayılan olarak string/sayı için $gte
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
                case 'q_search': // 'q' query parametresi için
                    if (typeof filterValue === 'string') {
                        const searchQuery = { $regex: filterValue, $options: 'i' };
                        const searchFields = resourceSchemaFields.q_fields || [];
                        if (searchFields.length > 0) {
                            finalMongoFilters.$or = searchFields.map(field => ({ [field]: searchQuery }));
                        }
                    }
                    break;
                case 'exact_match': // Varsayılan durum
                default:
                    if (fieldTypeHandler === 'objectId') {
                        if (mongoose.Types.ObjectId.isValid(filterValue)) {
                            finalMongoFilters[actualKey] = new mongoose.Types.ObjectId(filterValue);
                        } else {
                            // console.warn(`Invalid ObjectId for filter key ${actualKey}: ${filterValue}`);
                            // Eşleşmemesi için imkansız bir değer atayabiliriz veya filtreyi atlayabiliriz.
                            // finalMongoFilters[actualKey] = null; // Bu, null olanları arar, yanlış.
                            // En iyisi bu filtreyi hiç eklememek eğer ID geçersizse.
                        }
                    } else if (fieldTypeHandler === 'boolean') {
                        if (filterValue === 'true') finalMongoFilters[actualKey] = true;
                        else if (filterValue === 'false') finalMongoFilters[actualKey] = false;
                    } else { // string, number için tam eşleşme (status gibi)
                        finalMongoFilters[actualKey] = filterValue;
                    }
                    break;
            }
        }
    }
    return finalMongoFilters;
};

module.exports = { buildMongoFilters };