/**
 * Format a date string to a readable time
 */
export const formatTime = (dateString: string | undefined, showFullDate = true): string => {
  try {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    const hour = date.getHours();
    const hour12 = hour % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    if (showFullDate) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year} ${hour12}:${minutes} ${ampm}`;
    }
    
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Check if a message is from today
 */
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const messageDate = new Date(dateString);
  
  return (
    today.getDate() === messageDate.getDate() &&
    today.getMonth() === messageDate.getMonth() &&
    today.getFullYear() === messageDate.getFullYear()
  );
};

/**
 * Get a friendly date string like "Today", "Yesterday" or the actual date
 */
export const getFriendlyDate = (dateString: string): string => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isToday(dateString)) {
    return 'Today';
  } else if (
    yesterday.getDate() === messageDate.getDate() &&
    yesterday.getMonth() === messageDate.getMonth() &&
    yesterday.getFullYear() === messageDate.getFullYear()
  ) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};
