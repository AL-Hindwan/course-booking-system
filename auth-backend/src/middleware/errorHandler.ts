import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    console.error('Error:', err);

    if (err.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 401);
    }

    return sendError(res, 'Internal server error', 500);
};
