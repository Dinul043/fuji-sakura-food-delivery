// Shared constants for the application
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Converts image path to full URL for rendering
 * Handles both relative paths and full URLs safely
 * 
 * @param imagePath - Can be:
 *   - Full URL: "http://localhost:8000/uploads/menu_images/image.png"
 *   - Relative path: "/uploads/menu_images/image.png"
 *   - Relative without slash: "uploads/menu_images/image.png"
 *   - null/undefined/empty
 * 
 * @returns Full URL ready for img src, or placeholder emoji
 */
export function getFullImageUrl(imagePath?: string | null): string {
  // Handle empty/null/undefined
  if (!imagePath || imagePath.trim() === '') {
    return '🍽️';
  }

  // If already a full URL (starts with http:// or https://), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path to uploads, make it absolute
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE_URL}${cleanPath}`;
  }

  // If it's a static image path (from public folder), make it absolute
  if (imagePath.startsWith('/images/') || imagePath.startsWith('images/')) {
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://localhost:3000${cleanPath}`;
  }

  // If it's an emoji or other text, return as-is
  if (imagePath.length <= 2) {
    return imagePath;
  }

  // Default fallback - return placeholder
  return '🍽️';
}