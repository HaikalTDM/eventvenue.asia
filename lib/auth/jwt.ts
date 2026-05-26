import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-in-production");
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret-change");

export interface JwtPayload {
  sub: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  vendorId: string | null;
  vendorType: string | null;
}

export async function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "3600", 10);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setSubject(payload.sub)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  const expiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || "604800", 10);
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .setSubject(userId)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as unknown as JwtPayload;
}
