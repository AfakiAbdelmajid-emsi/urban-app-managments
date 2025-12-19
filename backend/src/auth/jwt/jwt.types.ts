export interface JwtStrategyOptions {
  jwtFromRequest: (req: any) => string | null;
  ignoreExpiration: boolean;
  secretOrKey: string;
}
