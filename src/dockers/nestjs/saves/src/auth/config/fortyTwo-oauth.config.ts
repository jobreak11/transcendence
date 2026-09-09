import { registerAs } from "@nestjs/config";

export default registerAs('fortyTwoOAuth', () => ({
  clientID: process.env.OAUTH_42_CLIENT_ID ?? '',
  clientSecret: process.env.OAUTH_42_CLIENT_SECRET ?? '',
  callbackURL: process.env.OAUTH_42_CALLBACK_URL
}))