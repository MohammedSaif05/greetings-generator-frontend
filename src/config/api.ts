/**
 * Shared API configuration for production and development environments.
 *
 * In development, the Vite proxy (vite.config.ts) forwards /api/* requests
 * to the backend, so API_URL is empty (relative paths work).
 *
 * In production, the frontend and backend are on different Render domains,
 * so we need the full backend URL.
 */
export const API_URL = import.meta.env.PROD
  ? 'https://greetings-generator.onrender.com'
  : '';
