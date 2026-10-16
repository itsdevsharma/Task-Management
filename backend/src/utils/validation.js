export const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value);

export const sanitizeSearch = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
