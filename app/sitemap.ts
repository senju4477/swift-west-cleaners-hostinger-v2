import type { MetadataRoute } from 'next';
import { services } from './content';
import { siteIndexable, siteUrl } from './site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIndexable) return [];
  return ['', 'services', ...services.map(service => service.slug), 'about', 'contact', 'privacy', 'terms']
    .map(path => ({ url: siteUrl + '/' + path, changeFrequency: 'monthly', priority: path === '' ? 1 : path === 'contact' ? 0.9 : 0.7 }));
}
