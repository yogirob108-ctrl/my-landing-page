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
        `${siteUrl}/images/rob-zaher.jpg`,
        `${siteUrl}/images/lake.jpg`,
      ],
    },
    {
      url: `${siteUrl}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
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
