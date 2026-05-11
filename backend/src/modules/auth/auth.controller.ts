import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as authService from './auth.service';
import { LoginSchema } from './auth.schema';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = LoginSchema.parse(req.body);
  const result = await authService.login(input);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({
    status: 'success',
    data: { accessToken: result.accessToken, user: result.user },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.user?.id) {
    await authService.logout(req.user.id);
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ status: 'success', message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ status: 'error', message: 'No refresh token provided' });
    return;
  }
  const result = await authService.refresh(token);
  res.json({ status: 'success', data: { accessToken: result.accessToken, user: result.user } });
});

export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await authService.me(req.user!.id);
  res.json({ status: 'success', data: user });
});
