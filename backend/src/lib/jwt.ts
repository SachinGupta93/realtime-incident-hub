import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export function signAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as SignOptions['expiresIn']) ?? '15m',
    };
    return jwt.sign(payload, JWT_SECRET, options);
}

export function signRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as SignOptions['expiresIn']) ?? '7d',
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
