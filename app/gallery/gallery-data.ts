export type GalleryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape' | 'square';
};

export const GALLERY_IMAGES: GalleryImage[] = [
  { src: '/images/gallery-extra/ger-and-land-cruiser-rain.jpg', alt: 'Ger and Land Cruiser in the rain', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/gallery-extra/horseman-under-larch-trees.jpg', alt: 'Horseman under larch trees', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/gallery-extra/horses-and-child-by-lake.jpg', alt: 'Child walking past horses beside the lake', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/gallery-extra/horses-in-forest-rain.jpg', alt: 'Pack horses resting in the forest rain', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/gallery-extra/packed-horses-rain-camp.jpg', alt: 'Packed horses waiting under storm clouds', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/gallery-extra/rain-jacket-valley-view.jpg', alt: 'Rain jacket view across the valley', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/gallery-extra/horseback-storm-valley-pov.jpg', alt: 'Horseback point of view riding into a stormy mountain valley', width: 1152, height: 864, orientation: 'landscape' },
  { src: '/images/gallery-extra/orkhon-valley-sunburst-panorama.jpg', alt: 'Sunburst over the Orkhon Valley river bends after rain', width: 1800, height: 1013, orientation: 'landscape' },
  { src: '/images/gallery-extra/rider-mountain-clouds.jpg', alt: 'Rider and horse below mountain clouds', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/gallery-extra/rider-rearing-horse-wide.jpg', alt: 'Rider on a rearing horse against the sky', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/expedition-originals/ger-and-van-camp-wide.jpg', alt: 'Ger and van camp beneath the mountains', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/expedition-originals/ger-blue-hour-original.jpg', alt: 'Ger at blue hour beneath the mountains', width: 1600, height: 1066, orientation: 'landscape' },
  { src: '/images/expedition-originals/ger-sunrise-original.jpg', alt: 'Ger at sunrise in the valley', width: 1600, height: 1066, orientation: 'landscape' },
  { src: '/images/expedition-originals/grazing-horse-river-sun-portrait.jpg', alt: 'Horse grazing beside a sunlit river', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/expedition-originals/horseman-valley-lookout-portrait.jpg', alt: 'Horseman looking across the Orkhon Valley', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/expedition-originals/layered-hills-sunset-wide.jpg', alt: 'Layered hills at sunset', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/expedition-originals/motorbike-valley-dusk-portrait.jpg', alt: 'Motorbike above the valley at dusk', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/expedition-originals/mountain-sunset-river-wide.jpg', alt: 'Mountain sunset above a winding river', width: 1620, height: 1080, orientation: 'landscape' },
  { src: '/images/expedition-originals/rider-storm-valley-panorama-portrait.jpg', alt: 'Rider under dramatic storm clouds in the valley', width: 1536, height: 2048, orientation: 'portrait' },
  { src: '/images/expedition-originals/river-horseman-silhouette-portrait.jpg', alt: 'Horseman silhouetted beside the river', width: 1036, height: 1439, orientation: 'portrait' },
  { src: '/images/expedition-originals/storm-cloud-valley-panorama.jpg', alt: 'Panoramic storm clouds over the valley', width: 2048, height: 1536, orientation: 'landscape' },
  { src: '/images/expedition-originals/suma-motorbike-field-portrait.jpg', alt: 'Suma on a motorbike in the open field', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/gallery-extra/suma-hunting-binoculars-portrait.jpg', alt: 'Suma scanning the valley with binoculars while hunting', width: 864, height: 1152, orientation: 'portrait' },
  { src: '/images/gallery-extra/suma-rifle-mountain-portrait.jpg', alt: 'Suma resting beside a rifle above the mountain valley', width: 864, height: 1152, orientation: 'portrait' },
  { src: '/images/expedition-originals/suma-river-crossing-original.jpg', alt: 'Suma riding through a shallow river crossing', width: 1200, height: 1600, orientation: 'portrait' },
  { src: '/images/expedition-originals/yaks-river-backlit-portrait.jpg', alt: 'Yaks grazing beside the river in backlit evening sun', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/eagle-portrait-original.jpg', alt: 'Close portrait of a Mongolian eagle', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/family.jpg', alt: 'Host family life in the valley', width: 1140, height: 822, orientation: 'landscape' },
  { src: '/images/gallery-extra/ger-family-meal.jpg', alt: 'Guests sharing a meal with the host family inside a ger', width: 1152, height: 864, orientation: 'landscape' },
  { src: '/images/ger-interior.jpg', alt: 'Inside a traditional ger', width: 2000, height: 1500, orientation: 'landscape' },
  { src: '/images/gallery-extra/heated-ger-interior.jpg', alt: 'Warm ger interior with beds and a wood stove', width: 1448, height: 1086, orientation: 'landscape' },
  { src: '/images/gers2.jpg', alt: 'Traditional gers in open country', width: 2000, height: 1500, orientation: 'landscape' },
  { src: '/images/guide-horse-portrait.jpg', alt: 'Suma standing with his horse on the open steppe', width: 997, height: 1496, orientation: 'portrait' },
  { src: '/images/guide.jpg', alt: 'Suma, local horseman and guide', width: 1152, height: 2048, orientation: 'portrait' },
  { src: '/images/herder-valley-portrait.jpg', alt: 'Horseman watching over the valley and grazing herd', width: 1080, height: 1620, orientation: 'portrait' },
  { src: '/images/lake.jpg', alt: 'Eight Lakes valley and water', width: 1200, height: 1600, orientation: 'portrait' },
  { src: '/images/riding2.jpg', alt: 'Rider crossing shallow water on horseback', width: 1200, height: 900, orientation: 'landscape' },
  { src: '/images/gallery-extra/rob-horseback-river-valley.jpg', alt: 'Robert Zaher smiling on horseback beside a river valley', width: 1152, height: 864, orientation: 'landscape' },
  { src: '/images/rob-zaher.jpg', alt: 'Robert Zaher in Mongolia', width: 768, height: 1024, orientation: 'portrait' },
  { src: '/images/testimonial-fin-bennet.jpg', alt: 'Fin with children beside a ger', width: 1400, height: 1050, orientation: 'landscape' },
  { src: '/images/testimonial-irik-clawson.jpg', alt: 'Irik riding at sunset', width: 1024, height: 768, orientation: 'landscape' },
]
