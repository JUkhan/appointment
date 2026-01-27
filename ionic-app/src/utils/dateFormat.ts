import { format, parseISO } from 'date-fns';

/**
 * Date formatting utilities
 */

/**
 * Format date for appointment display
 * @param date - Date object, ISO string, or RFC 2822 string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatAppointmentDate = (date: Date | string): string => {
  try {
    // Handle string dates - try native Date parser first (handles RFC 2822 and ISO)
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      // Fallback to parseISO for strict ISO strings
      const isoDate = parseISO(date as string);
      return format(isoDate, 'MMM dd, yyyy');
    }

    return format(dateObj, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid date';
  }
};

/**
 * Format date for API (YYYY-MM-DD)
 * @param date - Date object
 * @returns ISO date string
 */
export const formatDateForAPI = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};

/**
 * Parse date string to Date object
 * @param dateString - ISO date string
 * @returns Date object
 */
export const parseDate = (dateString: string): Date => {
  try {
    return parseISO(dateString);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

/**
 * Format time for display
 * @param date - Date object, ISO string, or RFC 2822 string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (date: Date | string): string => {
  try {
    // Handle string dates - try native Date parser first (handles RFC 2822 and ISO)
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      // Fallback to parseISO for strict ISO strings
      const isoDate = parseISO(date as string);
      return format(isoDate, 'h:mm a');
    }

    return format(dateObj, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

export function calculateTimeSlot(availability: string, serialNumber: number) {
  /**
   * Calculate time slot by adding (serialNumber * 10 minutes) to availability start time
   * @param {string} availability - Format: 'Mon-Fri 9AM-5PM' or 'Mon, Wed, Fri 8AM-4PM'
   * @param {number} serialNumber - Number to multiply by 10 minutes
   * @returns {string} - Formatted time like '4:20 PM'
   */

  // Extract start time from availability string
  // Pattern matches: 9AM, 9:30AM, 10AM, 12:45PM, etc.
  const timeMatch = availability.match(/(\d+):?(\d*)([AP]M)/);

  if (!timeMatch) {
    throw new Error('Invalid availability format');
  }
  if (serialNumber === 1) {
    serialNumber = 0;
  }
  let startHour = parseInt(timeMatch[1]);
  const startMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const period = timeMatch[3];

  // Convert to 24-hour format for calculation
  if (period === 'PM' && startHour !== 12) {
    startHour += 12;
  } else if (period === 'AM' && startHour === 12) {
    startHour = 0;
  }

  // Calculate total minutes: start time + (serialNumber * 10 minutes)
  const totalMinutes = startHour * 60 + startMinute + serialNumber * 10;

  // Convert back to hours and minutes
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;

  // Determine AM/PM
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  // Pad minutes with leading zero if needed
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${strMinutes} ${ampm}`;
}
