import { compare } from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../config/jwt';
import { TokenPayload } from '../../config/jwt';

describe('JWT Token Management', () => {
  const testPayload: TokenPayload = {
    id: 'test-user-id',
    email: 'test@example.com',
    companyId: 'test-company-id',
    role: 'employee' as const,
    employeeId: 'test-employee-id'
  };

  describe('signAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = signAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = signAccessToken(testPayload);
      const token2 = signAccessToken({ ...testPayload, id: 'different-id' });
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = signAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.companyId).toBe(testPayload.companyId);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredPayload = { ...testPayload, exp: Math.floor(Date.now() / 1000) - 3600 };
      const expiredToken = signAccessToken(expiredPayload);
      
      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });
  });

  describe('signRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = signRefreshToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = signRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
    });
  });
});

describe('Password Utilities', () => {
  describe('compare passwords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword123';
      const hashedPassword = await compare(password, '$2b$10$testHash');
      
      expect(hashedPassword).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'wrongPassword';
      const hashedPassword = await compare(password, '$2b$10$testHash');
      
      expect(hashedPassword).toBe(false);
    });
  });
});
