export function calculateTimeSlot(availability, serialNumber) {
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
  let startMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const period = timeMatch[3];

  // Convert to 24-hour format for calculation
  if (period === 'PM' && startHour !== 12) {
    startHour += 12;
  } else if (period === 'AM' && startHour === 12) {
    startHour = 0;
  }

  // Calculate total minutes: start time + (serialNumber * 10 minutes)
  let totalMinutes = startHour * 60 + startMinute + serialNumber * 10;

  // Convert back to hours and minutes
  let hours = Math.floor(totalMinutes / 60) % 24;
  let minutes = totalMinutes % 60;

  // Determine AM/PM
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  // Pad minutes with leading zero if needed
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutes} ${ampm}`;
}

export function stripMarkdown(text) {
  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')

      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')

      // Remove bold and italic
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')

      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')

      // Remove blockquotes
      .replace(/^\s*>\s+/gm, '')

      // Remove horizontal rules
      .replace(/^[\-*_]{3,}\s*$/gm, '')

      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')

      // Remove extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
