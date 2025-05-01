export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '1h',
  refreshExpiresIn: '7d',
};

export const jwtConfig = {
  global: true,
  secret: jwtConstants.secret,
  signOptions: { expiresIn: jwtConstants.expiresIn },
};
