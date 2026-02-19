import type { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      member?: {
        memberId: string;
        email: string;
        role: string;
      };
    }
  }
}

/** Extracts JWT from Authorization header if present. Does not reject. */
export const optionalMember: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      req.member = verifyToken(token);
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }
  next();
};

/** Requires a valid JWT. Returns 401 if missing or invalid. */
export const requireMember: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const token = authHeader.slice(7);
    req.member = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/** Requires valid JWT + approved status (role !== "guest"). */
export const requireApprovedMember: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload.role === "guest") {
      return res.status(403).json({ message: "Account pending approval" });
    }
    req.member = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
