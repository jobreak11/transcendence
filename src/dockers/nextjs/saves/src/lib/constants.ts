
export const BACKEND_URL = `http://nestjs:${process.env.TRANSCENDENCE_NESTJS_EXPOSE_PORT}`;

export const DEFAULT_LANDING_PAGE_URL = '/';

// cookie for access token valid for only 12 hours 
export const ACCESS_TOKEN_COOKIE_EXPIRE_TIME = 60 * 60 * 12;

// cookie for refresh token is longer and would take 7 days
export const REFRESH_TOKEN_COOKIE_EXPIRE_TIME = 60 * 60 * 24 * 7;