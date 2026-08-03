/**
 * Format date to PT-BR format (dd/mm/yyyy)
 * @param date - Date string or Date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatDatePtBr(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle YYYY-MM-DD format (from HTML date input)
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-');
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        // Validate month and day ranges
        if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
          return '-';
        }
        dateObj = new Date(parseInt(year), monthNum - 1, dayNum);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format time to HH:mm format (without seconds)
 * @param time - Time string (HH:mm:ss or HH:mm) or Date object
 * @returns Formatted time string in HH:mm format
 */
export function formatTimePtBr(time: string | Date | null | undefined): string {
  if (!time) return '-';

  try {
    let timeStr: string;

    if (typeof time === 'string') {
      // If it's a time string like "14:30:00" or "14:30"
      if (time.includes(':')) {
        const parts = time.split(':');
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      // If it's a datetime string
      const dateObj = new Date(time);
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
      timeStr = dateObj.toTimeString();
    } else {
      timeStr = time.toTimeString();
    }

    const hours = timeStr.substring(0, 2);
    const minutes = timeStr.substring(3, 5);

    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
}

/**
 * Format datetime to PT-BR format (dd/mm/yyyy HH:mm)
 * @param datetime - Datetime string or Date object
 * @returns Formatted datetime string in dd/mm/yyyy HH:mm format
 */
export function formatDateTimePtBr(datetime: string | Date | null | undefined): string {
  if (!datetime) return '-';

  try {
    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const date = formatDatePtBr(dateObj);
    const time = formatTimePtBr(dateObj);

    return `${date} ${time}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
}
