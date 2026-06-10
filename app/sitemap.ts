import type { MetadataRoute } from 'next'

const siteUrl = 'https://www.8lakestours.com'
const lastModified = new Date('2026-06-09')

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
      images: [
        `${siteUrl}/images/hero-horseback.jpg`,
        `${siteUrl}/images/rob-family.jpg`,
        `${siteUrl}/images/lake.jpg`,
      ],
    },
    {
      url: `${siteUrl}/terms`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
