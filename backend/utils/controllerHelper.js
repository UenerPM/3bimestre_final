const toCamel = (s) => {
  if (!s) return s;
  return s.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());
};

function transformObjectKeysToCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const newKey = toCamel(k);
    if (Array.isArray(v)) out[newKey] = v.map(transformObjectKeysToCamel);
    else if (v && typeof v === 'object' && !(v instanceof Date)) out[newKey] = transformObjectKeysToCamel(v);
    else out[newKey] = v;
  }
  return out;
}

const util = {
  parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  },

  // responses helpers
  respondCreated(res, obj, transform = true) {
    return res.status(201).json(transform ? transformObjectKeysToCamel(obj) : obj);
  },

  respondJson(res, obj, transform = true) {
    return res.json(transform ? transformObjectKeysToCamel(obj) : obj);
  },

  respondList(res, arr, transform = true) {
    if (!Array.isArray(arr)) return res.json(arr);
    return res.json(transform ? arr.map(transformObjectKeysToCamel) : arr);
  },

  respondNoContent(res) {
    return res.status(204).send();
  },

  respondBadRequest(res, message) {
    return res.status(400).json({ error: message });
  },

  respondNotFound(res, message) {
    return res.status(404).json({ error: message });
  },

  respondServerError(res, error) {
    console.error('Server error:', error && error.stack ? error.stack : error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  },

  transformObjectKeysToCamel,
};

module.exports = util;


