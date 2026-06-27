import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;

interface TokenPayload {
  memberId: string;
  email: string;
  role: string;
}

type TokenType = "access" | "refresh";

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, typ: "access" }, JWT_SECRET, { expiresIn: "1h" });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, typ: "refresh" }, JWT_SECRET, { expiresIn: "30d" });
}

// Enforces the token's `typ` so a long-lived refresh token cannot be presented as an
// access token (and vice-versa). Defaults to "access" since that is what API/WS auth use.
// NOTE: tokens issued before the `typ` claim existed are rejected — members re-login once.
export function verifyToken(token: string, expectedType: TokenType = "access"): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { typ?: TokenType };
  if (decoded.typ !== expectedType) {
    throw new Error(`Invalid token type: expected ${expectedType}, got ${decoded.typ ?? "none"}`);
  }
  return { memberId: decoded.memberId, email: decoded.email, role: decoded.role };
}
