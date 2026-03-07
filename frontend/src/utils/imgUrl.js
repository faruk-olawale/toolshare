const PLACEHOLDER = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80';

/**
 * Safely resolve an image URL.
 * Handles:
 *   - Normal Cloudinary URLs:    https://res.cloudinary.com/... → as-is
 *   - Newlines in URL (DB bug):  https://res.cloudinary.com/...\njpg → trimmed
 *   - Missing colon in protocol: https//res.cloudinary.com/...  → fixed
 *   - Old local /uploads/ paths: /uploads/tools/file.jpg        → prepend API base
 *   - Empty / null                                               → placeholder
 */
export const getImgUrl = (url) => {
  if (!url) return PLACEHOLDER;

  // Strip all whitespace and newlines (fixes DB entries with embedded newlines)
  let fixed = url.replace(/\s+/g, '');

  // Fix missing colon in protocol (https// → https://)
  fixed = fixed.replace(/^(https?)(\/\/)/, '$1:$2');

  if (fixed.startsWith('http://') || fixed.startsWith('https://')) return fixed;

  // Relative /uploads/ path — prepend API base
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return `${base}${fixed}`;
};

export { PLACEHOLDER };