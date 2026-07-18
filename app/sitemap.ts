import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  const blogPages: MetadataRoute.Sitemap = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => ({
          url: `https://www.neatx.store/blog/${file.replace(/\.md$/, '')}`,
          lastModified: fs.statSync(path.join(blogDir, file)).mtime,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
    : [];

  return [
    {
      url: 'https://www.neatx.store/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.neatx.store/privacy',
      lastModified: new Date('2026-07-18'),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://www.neatx.store',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.neatx.store/registrazione',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.neatx.store/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://www.neatx.store/termini',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...blogPages,
  ];
}
