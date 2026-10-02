import type { MetadataRoute } from 'next';
import { siteIndexable, siteUrl } from './site-config';

export default function robots(): MetadataRoute.Robots {
  return siteIndexable
    ? { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: siteUrl + '/sitemap.xml' }
    : { rules: { userAgent: '*', disallow: '/' } };
}
