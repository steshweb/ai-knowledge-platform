export type AccessTokenPayload = {
  sub: string;
  sid: string;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: 'refresh';
};

export type AuthenticatedUser = {
  id: string;
  email: string;
};
