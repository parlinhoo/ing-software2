import { generateUserJWT, requireAuth } from "@src/auth/authService";
import HttpStatusCodes from "@src/constants/httpStatusCodes";
import { RouteError } from "@src/utils/route-errors";
import jwt from "jsonwebtoken"

vi.mock('jsonwebtoken');

vi.mock('@src/constants/environment', () => ({
  default: { JWT_SECRET: 'secreto_falso_para_tests'}
}));

describe('Auth JWT Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateToken()', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      mockReq = { headers: {} };
      mockRes = {};
      mockNext = vi.fn();
    });

    it('debería lanzar RouteError si no hay cabecera de autorización', () => {
      expect(() => requireAuth(mockReq, mockRes, mockNext)).toThrow(
        expect.objectContaining({
          status: HttpStatusCodes.UNAUTHORIZED,
          message: 'Acceso denegado. Token no proporcionado.'
        })
      );
    });

    it('debería lanzar RouteError si la cabecera no empieza con Bearer', () => {
      mockReq.headers.authorization = 'TokenInvalido 123456';

      expect(() => requireAuth(mockReq, mockRes, mockNext)).toThrow(RouteError);
    });

    it('debería inyectar el usuario en request y llamar a next() si el token es válido', () => {
      mockReq.headers.authorization = 'Bearer token_valido';
      const mockPayload = { userId: '1', roleId: '2' };
      
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);

      requireAuth(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('token_valido', 'secreto_falso_para_tests');
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it('debería lanzar RouteError por sesión expirada si jwt lanza TokenExpiredError', () => {
      mockReq.headers.authorization = 'Bearer token_expirado';
      
      // Simulamos el error específico de expiración
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      expect(() => requireAuth(mockReq, mockRes, mockNext)).toThrow(
        expect.objectContaining({
          status: HttpStatusCodes.UNAUTHORIZED,
          message: 'La sesión ha expirado. Vuelve a iniciar sesión.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debería lanzar RouteError generico si jwt lanza un error distinto', () => {
      mockReq.headers.authorization = 'Bearer token_corrupto';
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Firma inválida');
      });

      expect(() => requireAuth(mockReq, mockRes, mockNext)).toThrow(
        expect.objectContaining({
          status: HttpStatusCodes.UNAUTHORIZED,
          message: 'Token inválido o corrupto.'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});