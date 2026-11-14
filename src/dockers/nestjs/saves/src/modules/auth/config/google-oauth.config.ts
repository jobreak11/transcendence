import { registerAs } from "@nestjs/config";

export default registerAs('googleOAuth', () => ({
  clientID: process.env.OAUTH_GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? '',
  callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL
}))