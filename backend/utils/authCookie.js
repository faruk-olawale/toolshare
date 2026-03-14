const COOKIE_NAME = 'tsa_token';

const parseCookies = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, segment) => {
      const index = segment.indexOf('=');
      const key = index >= 0 ? segment.slice(0, index) : segment;
      const value = index >= 0 ? segment.slice(index + 1) : '';
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

const getAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    ...getAuthCookieOptions(),
    maxAge: undefined,
  });
};

module.exports = {
  COOKIE_NAME,
  parseCookies,
  setAuthCookie,
  clearAuthCookie,
};
