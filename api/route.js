'use strict';

const { routeQuery } = require('../lib/route-handler');

const buckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 30;

function limited(ip) {
  const now = Date.now();
  const current = buckets.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + WINDOW_MS;
  }
  current.count += 1;
  buckets.set(ip, current);
  return current.count > MAX_REQUESTS;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'invalid', message: 'Use POST.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (limited(ip)) {
    return res.status(429).json({ status: 'unavailable', message: 'Too many requests. Please try again later.' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const result = await routeQuery(body.query);
  const httpStatus = result.status === 'invalid' ? 400 : result.status === 'unavailable' ? 503 : 200;
  return res.status(httpStatus).json(result);
};

function safeJson(text) {
  try { return JSON.parse(text); } catch { return {}; }
}
