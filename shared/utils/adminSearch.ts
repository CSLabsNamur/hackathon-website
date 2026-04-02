export const ADMIN_SEARCH_MIN_QUERY_LENGTH = 2;
export const ADMIN_SEARCH_DEFAULT_LIMIT = 24;
export const ADMIN_SEARCH_MAX_LIMIT = 40;

/**
 * A single search result.
 */
export interface AdminSearchItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  to: string;
}

/**
 * A grouped search section, usually for one model.
 */
export interface AdminSearchGroup {
  id: string;
  label: string;
  items: AdminSearchItem[];
}

/**
 * Response shape for the API endpoint.
 */
export interface AdminSearchResponse {
  groups: AdminSearchGroup[];
}
