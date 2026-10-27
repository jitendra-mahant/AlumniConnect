const mongoose = require('mongoose');
const ApiError = require('./ApiError');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Throws a 400 if the id is not a valid ObjectId.
const assertId = (id, label = 'id') => {
  if (!isValidId(id)) throw new ApiError(400, `Invalid ${label}`);
};

// Escape user input before using it inside a RegExp.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts arrays or comma-separated strings, returns a clean string array.
const toArray = (v) => {
  if (v === undefined || v === null || v === '') return [];
  const arr = Array.isArray(v) ? v : String(v).split(',');
  return arr.map((x) => String(x).trim()).filter(Boolean);
};

const toBool = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  return v === true || v === 'true' || v === '1';
};

// Copy only whitelisted keys from an object.
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// Validate URL protocols to prevent javascript: or other XSS vectors
const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Normalize and validate LinkedIn URL
const normalizeLinkedInUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  if (!str) return '';
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }
  try {
    const parsed = new URL(str);
    if (!parsed.hostname.toLowerCase().includes('linkedin.com')) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

// IDOR protection helper: checks if requester owns resource or is admin
const assertOwnerOrAdmin = (req, resourceOwnerId, message = 'You do not have permission to modify this resource.') => {
  const isOwner = String(resourceOwnerId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, message);
  }
};

module.exports = { isValidId, assertId, escapeRegex, toArray, toBool, pick, isSafeUrl, normalizeLinkedInUrl, assertOwnerOrAdmin };
