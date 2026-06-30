import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// El endpoint /students/search usa searchStudents (búsqueda combinada nombre+RUT
// con coincidencia parcial). Mockeamos esa función para no depender de la BD.
vi.mock('@src/services/studentService', () => ({
  searchStudents: vi.fn(),
}));

import app from '@src/server';
import * as studentService from '@src/services/studentService';
import { generateUserJWT } from '@src/auth/authService';

type StudentData = {
  rut: string;
  name: string;
  class: string;
};

const mockedStudentService = studentService as unknown as {
  searchStudents: ReturnType<typeof vi.fn>;
};

// Orientador Andrea: userId 5, roleId 4. Cualquier rol autorizado sirve para /students/search.
const tokenOrientador = generateUserJWT(5, 4);

describe('API server', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /students/search - búsqueda por RUT', () => {
    it('retorna el estudiante cuando el RUT existe', async () => {
      const expectedStudent: StudentData = {
        rut: '11111111-1',
        name: 'Juan Pérez',
        class: '4B',
      };

      mockedStudentService.searchStudents.mockResolvedValueOnce([expectedStudent]);

      const response = await request(app)
        .get('/students/search')
        .set('Authorization', `Bearer ${tokenOrientador}`)
        .query({ q: '11111111-1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([expectedStudent]);
      expect(mockedStudentService.searchStudents).toHaveBeenCalledWith('11111111-1');
    });

    it('retorna array vacío cuando el RUT no existe', async () => {
      mockedStudentService.searchStudents.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/students/search')
        .set('Authorization', `Bearer ${tokenOrientador}`)
        .query({ q: '99999999-9' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /students/search - búsqueda por nombre', () => {
    it('retorna lista de estudiantes cuando el nombre coincide', async () => {
      const expectedStudents: StudentData[] = [
        { rut: '12345678-9', name: 'Juan Pérez', class: '4B' },
      ];

      mockedStudentService.searchStudents.mockResolvedValueOnce(expectedStudents);

      const response = await request(app)
        .get('/students/search')
        .set('Authorization', `Bearer ${tokenOrientador}`)
        .query({ q: 'Juan Pérez' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedStudents);
      expect(mockedStudentService.searchStudents).toHaveBeenCalledWith('Juan Pérez');
    });

    it('retorna varios estudiantes cuando hay más de una coincidencia por nombre', async () => {
      const expectedStudents: StudentData[] = [
        { rut: '12345678-9', name: 'Juan Pérez', class: '4B' },
        { rut: '98765432-1', name: 'Juan Pérez', class: '3A' },
      ];

      mockedStudentService.searchStudents.mockResolvedValueOnce(expectedStudents);

      const response = await request(app)
        .get('/students/search')
        .set('Authorization', `Bearer ${tokenOrientador}`)
        .query({ q: 'Juan Pérez' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(expectedStudents);
    });

    it('retorna array vacío cuando no hay estudiantes con ese nombre', async () => {
      mockedStudentService.searchStudents.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/students/search')
        .set('Authorization', `Bearer ${tokenOrientador}`)
        .query({ q: 'No Existe' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /students/search - sin parámetro', () => {
    it('retorna array vacío cuando no se envía el parámetro q', async () => {
      const response = await request(app)
        .get('/students/search')
        .set('Authorization', `Bearer ${tokenOrientador}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});