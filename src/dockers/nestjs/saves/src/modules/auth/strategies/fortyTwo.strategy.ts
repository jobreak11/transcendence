import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import fortyTwoOauthConfig from "../config/fortyTwo-oauth.config.js";
import type { ConfigType } from "@nestjs/config";
import { VerifiedCallback } from "passport-jwt";
import { AuthService } from "../auth.service.js";

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, 'fortyTwo') {
  constructor(
    @Inject(fortyTwoOauthConfig.KEY) private fortyTwoConfiguration: ConfigType<typeof fortyTwoOauthConfig>,
    private authService: AuthService,

  ) {
    super({
      authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
      tokenURL: 'https://api.intra.42.fr/oauth/token',
      clientID: fortyTwoConfiguration.clientID,
      clientSecret: fortyTwoConfiguration.clientSecret,
      callbackURL: fortyTwoConfiguration.callbackURL,
    })
  }

  async validate(accessToken: string) {

    const res = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch 42 profile: ${res.statusText}`);
    }

    const profile = await res.json()

    return await this.authService.validate42User({
      email: profile.email,
      password: '',
      displayName: profile.displayname,
      avatarUrl: profile.image?.link ?? '',
    });

  }

}