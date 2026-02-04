/**
 * Converts R2 image URLs to use the Vite proxy in development to avoid CORS issues.
 * In production, returns the original URL.
 */
export function getProxiedImageUrl(url: string): string {
  // Check if this is a development environment
  const isDev = import.meta.env.DEV;
  
  // Check if the URL is from the R2 bucket
  const r2Domain = 'pub-72ca2213966948abad1a223268ee0ac2.r2.dev';
  
  if (isDev && url.includes(r2Domain)) {
    // Replace the R2 domain with our proxy path
    return url.replace(`https://${r2Domain}`, '/r2-proxy');
  }
  
  return url;
}
