/**
 * Prayer Times Calculator
 * Calculates Islamic prayer times for a given location and date
 * Uses the Adhan library (https://github.com/batoulapps/Adhan)
 */

// Install: npm install adhan
// To use: import { getPrayerTimes } from './prayerTimesCalculator';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PrayerTime {
  name: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  time: string; // HH:MM format
}

interface PrayerTimesResult {
  date: string;
  prayers: PrayerTime[];
}

/**
 * Get prayer times for a specific location and date
 * @param coordinates - { latitude, longitude }
 * @param date - Date object or date string (YYYY-MM-DD)
 * @returns Array of 5 prayers with times in HH:MM format
 */
export async function getPrayerTimes(coordinates: Coordinates, date: Date | string): Promise<PrayerTimesResult> {
  try {
    // Dynamically import Adhan to avoid hard dependency
    const Adhan = await import('adhan');
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Create coordinates object for Adhan
    const coords = new Adhan.Coordinates(coordinates.latitude, coordinates.longitude);
    
    // Get prayer times using MuslimWorldLeague calculation method
    const prayerTimes = Adhan.getPrayerTimes(dateObj, coords, Adhan.CalculationMethod.MuslimWorldLeague());
    
    const prayers: PrayerTime[] = [
      { name: 'Fajr', time: formatTime(prayerTimes.fajr) },
      { name: 'Dhuhr', time: formatTime(prayerTimes.dhuhr) },
      { name: 'Asr', time: formatTime(prayerTimes.asr) },
      { name: 'Maghrib', time: formatTime(prayerTimes.maghrib) },
      { name: 'Isha', time: formatTime(prayerTimes.isha) },
    ];
    
    return {
      date: dateObj.toISOString().split('T')[0],
      prayers,
    };
  } catch (error) {
    if ((error as any).code === 'MODULE_NOT_FOUND') {
      throw new Error('Adhan library not installed. Run: npm install adhan');
    }
    throw error;
  }
}

/**
 * Get prayers that fall within a time range
 * @param prayers - Array of prayer times
 * @param startTime - Start time in HH:MM format (24-hour)
 * @param endTime - End time in HH:MM format (24-hour)
 * @returns Array of prayers within the time range
 */
export function getPrayersWithinRange(prayers: PrayerTime[], startTime: string, endTime: string): PrayerTime[] {
  return prayers.filter(prayer => {
    const prayerMinutes = timeToMinutes(prayer.time);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    return prayerMinutes >= startMinutes && prayerMinutes <= endMinutes;
  });
}

/**
 * Convert HH:MM time format to total minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert Date object to HH:MM format
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
