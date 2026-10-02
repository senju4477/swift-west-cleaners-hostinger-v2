const configuredUrl = process.env.SITE_URL || 'http://localhost:3000';
const origin = new URL(configuredUrl);
if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('SITE_URL must be an HTTP(S) origin without a path or credentials.');
}
export const siteUrl = origin.origin;
export const siteIndexable = process.env.SITE_INDEXABLE === 'true';
if (siteIndexable && (!process.env.SITE_URL || origin.protocol !== 'https:' || ['localhost', '127.0.0.1', '0.0.0.0'].includes(origin.hostname))) {
  throw new Error('Indexing requires an explicit production HTTPS SITE_URL.');
}
