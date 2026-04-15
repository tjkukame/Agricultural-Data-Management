/**
 * Sanitize user input to prevent XSS and trim whitespace
 */
export const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Trim whitespace and remove HTML tags (basic XSS prevention)
      sanitized[key] = value.trim().replace(/[<>]/g, '');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeInput(item));
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number (Lesotho format example)
 */
export const isValidPhone = (phone) => {
  const regex = /^[0-9]{8}$/;
  return regex.test(phone);
};

/**
 * Format number as currency (USD)
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

/**
 * Format area in hectares
 */
export const formatArea = (hectares) => {
  return `${hectares.toFixed(2)} ha`;
};