/**
 * Get canonical url
 * @param {*} url
 */
export function getCanonicalUrl(url) {
  // Parse the URL components
  const parsedUrl = new URL(url);

  // Remove the fragment part
  parsedUrl.hash = "";

  // Remove the utm parameters from the query string
  const queryParams = new URLSearchParams(parsedUrl.search);
  queryParams.delete("utm_source");
  queryParams.delete("utm_medium");
  queryParams.delete("utm_campaign");
  queryParams.delete("utm_term");
  queryParams.delete("utm_content");
  parsedUrl.search = queryParams.toString();

  // Remove the default port if present
  if (
    (parsedUrl.protocol === "http:" && parsedUrl.port === "80") ||
    (parsedUrl.protocol === "https:" && parsedUrl.port === "443")
  ) {
    parsedUrl.port = "";
  }

  // Sort the parameters by key name
  const sortedParams = new URLSearchParams(parsedUrl.search);
  sortedParams.sort();
  parsedUrl.search = sortedParams.toString();

  // Convert the URL object back to a string
  const canonicalUrl = parsedUrl.toString();

  return canonicalUrl;
}

/**
 * Get scheme and host and port string
 * Omit port number when it is default port
 * @param {*} url
 * @returns
 */
export function getSchemeAndHostAndPort(url) {
  const parsedUrl = new URL(url);
  const schemeHostPort = `${parsedUrl.protocol}//${parsedUrl.host}`;

  return schemeHostPort;
}
