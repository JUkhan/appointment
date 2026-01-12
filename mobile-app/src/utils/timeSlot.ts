/**
 * Calculate the actual appointment time based on availability and serial number
 * @param availability - Doctor's availability string (e.g., "9AM")
 * @param serialNumber - Appointment serial number (1, 2, 3, etc.)
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export const calculateTimeSlot = (
  availability: string,
  serialNumber: number
): string => {
  // Extract hour and period (AM/PM) from availability string
  const match = availability.match(/(\d+)(AM|PM)/i);
  if (!match) return availability;

  let hour = parseInt(match[1], 10);
  const period = match[2].toUpperCase();

  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  // Each appointment slot is 15 minutes
  // Serial 1 = 0:00, Serial 2 = 0:15, Serial 3 = 0:30, Serial 4 = 0:45, Serial 5 = 1:00
  const additionalMinutes = (serialNumber - 1) * 15;
  const totalMinutes = hour * 60 + additionalMinutes;

  const finalHour = Math.floor(totalMinutes / 60) % 24;
  const finalMinutes = totalMinutes % 60;

  // Convert back to 12-hour format
  const displayHour = finalHour === 0 ? 12 : finalHour > 12 ? finalHour - 12 : finalHour;
  const displayPeriod = finalHour >= 12 ? 'PM' : 'AM';
  const displayMinutes = finalMinutes.toString().padStart(2, '0');

  return `${displayHour}:${displayMinutes} ${displayPeriod}`;
};

/**
 * Format date to display string
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Jan 15, 2026")
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format date for API (YYYY-MM-DD)
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
