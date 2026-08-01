import HomePageClient from './HomePageClient';
import { getVisibleTourDates, TOUR_DATES } from '../lib/tour-dates.mjs';

export const revalidate = 3600;

export default function HomePage() {
  const tourDates = getVisibleTourDates(TOUR_DATES);
  return <HomePageClient tourDates={tourDates} />;
}
