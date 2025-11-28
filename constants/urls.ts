export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
} as const;

export const getLoginUrl = (error?: string) => {
  const base = `${APP_URL}${ROUTES.LOGIN}`;
  return error ? `${base}?error=${encodeURIComponent(error)}` : base;
};
