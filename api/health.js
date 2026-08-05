'use strict';

const { providerConfig } = require('../lib/provider');
const { getRecords } = require('../lib/router');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'invalid', message: 'Use GET.' });
  }

  try {
    const config = providerConfig(process.env);
    const configured = Boolean(config.apiKey);
    return res.status(configured ? 200 : 503).json({
      status: configured ? 'ready' : 'setup_required',
      provider: config.provider,
      model: config.model,
      endpoint: new URL(config.baseUrl).hostname,
      key_configured: configured,
      ignored_legacy_environment: config.ignoredLegacyKeys,
      reviewed_records: getRecords().length,
      node: process.version,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    });
  } catch (error) {
    console.error('[api/health] configuration failure', {
      code: error.code || 'UNKNOWN',
      message: error.message,
    });
    return res.status(503).json({
      status: 'configuration_error',
      message: error.message,
      code: error.code || 'UNKNOWN',
    });
  }
};
