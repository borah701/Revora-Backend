import { createHash } from 'node:crypto';
import { issueToken, verifyToken, TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../../lib/jwt';
import { RefreshTokenPayload, TokenService } from './types';
import { isUserRole } from '../login/types';

export class JwtTokenServiceAdapter implements TokenService {
    verifyRefreshToken(token: string): RefreshTokenPayload {
        const payload = verifyToken(token);
        if (payload.typ !== 'refresh') {
            throw new Error('Token is not a refresh token');
        }
        if (typeof payload.sid !== 'string' || !isUserRole(payload.role)) {
            throw new Error('Refresh token is missing required session claims');
        }
        return {
            userId: payload.sub,
            sessionId: payload.sid,
            role: payload.role,
        };
    }

    issueTokens(payload: RefreshTokenPayload): {
        accessToken: string;
        refreshToken: string;
    } {
        const accessToken = issueToken( {
            subject: payload.userId,
            expiresIn: TOKEN_EXPIRY,
            additionalPayload: {
                sid: payload.sessionId,
                role: payload.role,
                typ: 'access',
            },
        });

        const refreshToken = issueToken( {
            subject: payload.userId,
            expiresIn: REFRESH_TOKEN_EXPIRY,
            additionalPayload: {
                sid: payload.sessionId,
                role: payload.role,
                typ: 'refresh',
            },
        });

        return { accessToken, refreshToken };
    }

    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
