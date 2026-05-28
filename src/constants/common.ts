const configuredApiUrl: unknown = import.meta.env.VITE_API_URL;
export const API_BASE_URL =
  typeof configuredApiUrl === 'string' && configuredApiUrl.length > 0
    ? configuredApiUrl
    : 'http://127.0.0.1:3000';
export const GARAGE_PAGE_SIZE = 7;
export const WINNERS_PAGE_SIZE = 10;
export const MAX_CAR_NAME_LENGTH = 40;
