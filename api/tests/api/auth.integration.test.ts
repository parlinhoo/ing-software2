import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUserJWT, validateToken } from '@src/auth/authService';

vi.mock('@src/environment', () => ({
  default: { JWT_SECRET: 'abe4508163968bb56cf7a26e6ddf0bc679e0c102a0ed7d969e3f1bb51f0b5cf9' }
}));

describe('Integración JWT: Generación y Validación', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {}; 
    mockNext = vi.fn();
  });

  it('debería generar un token real que el middleware pueda decodificar exitosamente', () => {
    const userIdOriginal = 100;
    const roleIdOriginal = 5;
    
    const tokenGenerado = generateUserJWT(userIdOriginal, roleIdOriginal);

    expect(typeof tokenGenerado).toBe('string');
    expect(tokenGenerado.split('.').length).toBe(3); 

    mockReq.headers.authorization = `Bearer ${tokenGenerado}`;

    validateToken(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledOnce();

    expect(mockReq.user).toEqual(
      expect.objectContaining({
        userId: '100',
        roleId: '5'
      })
    );
  });
});