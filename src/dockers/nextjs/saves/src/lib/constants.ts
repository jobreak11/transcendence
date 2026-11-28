import  ms, { StringValue } from 'ms'

export const BACKEND_URL = `http://nestjs:${process.env.TRANSCENDENCE_NESTJS_EXPOSE_PORT}`;

export const DEFAULT_LANDING_PAGE_URL = '/';

// cookie for access token valid for only 12 hours 

const getExpireTimeSeconds = (minimumSeconds: number): number => {

	const value = (process.env.NESTJS_JWT_EXPIRE_TIME ?? "1h") as StringValue;

	const milisecs = ms(value);
	const rawSecs = Math.floor(milisecs / 1000) - 30;
	if (rawSecs < minimumSeconds) {
		return minimumSeconds;
	}
	else {
		return rawSecs;
	}
}

const getRefreshExpireTimeSeconds = (minimumSeconds: number): number => {

	const value = (process.env.NESTJS_REFRESH_EXPIRE_TIME ?? "7d") as StringValue;

	const milisecs = ms(value);
	const rawSecs = Math.floor(milisecs / 1000) - 30;
	if (rawSecs < minimumSeconds) {
		return minimumSeconds
	}
	else {
		return rawSecs;
	}
}

export const ACCESS_TOKEN_COOKIE_EXPIRE_TIME = getExpireTimeSeconds(30);

// cookie for refresh token is longer and would take 7 days
export const REFRESH_TOKEN_COOKIE_EXPIRE_TIME = getRefreshExpireTimeSeconds(60);

export const TRANSCENDENCE_BASE_URL = `https://${process.env.TRANSCENDENCE_DOMAIN_NAME ?? "localhost"}:${process.env.TRANSCENDENCE_NGINX_BIND_PORT ?? "4333"}`
export const TRANSCENDENCE_LOCAL_IP_BASE_URL = `https://${process.env.TRANSCENDENCE_LOCAL_IP_ADDRESS ?? "192.168.1.1"}:${process.env.TRANSCENDENCE_NGINX_BIND_PORT ?? "4333"}`

