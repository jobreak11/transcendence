import { Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-google-oauth20'
import googleOauthConfig from "../config/google-oauth.config.js";
import type { ConfigType } from "@nestjs/config";
import { VerifiedCallback } from "passport-jwt";
import { AuthService } from "../auth.service.js";

export class GoogleStrategy extends PassportStrategy(Strategy) {

  constructor(
    @Inject(googleOauthConfig.KEY) private googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
  ) {
    super({
      clientID: googleConfiguration.clientID,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackURL,
      scope: ['email', 'profile']
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any,
    done: VerifiedCallback
  ) {

    console.log({ profile });
    const user = await this.authService.validateGoogleUser({
      email: profile.emails[0].value,
      password: "",
      displayName: profile.displayName,
      avatarUrl: profile.photos[0].value,
    });

    done(null, user);
  }
}