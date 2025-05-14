export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
