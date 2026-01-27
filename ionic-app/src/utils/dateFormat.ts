import { format, parseISO } from 'date-fns';

/**
 * Date formatting utilities
 */

/**
 * Format date for appointment display
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatAppointmentDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
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
 * @param date - Date object or ISO string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};
