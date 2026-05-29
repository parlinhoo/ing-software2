import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('@src/services/studentService', () => ({
  getStudentByRut: vi.fn(),
  getStudentByName: vi.fn(),
}));

import app from '@src/server';
import * as studentService from '@src/services/studentService';

type Student = {
  id: number;
  run: string;
  nombre: string;
  curso: string;
  anioAcademico: number;
  activo: boolean;
};

const mockedStudentService = studentService as {
  getStudentByRut: any;
  getStudentByName: any;
};

describe('API server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /students/by-rut', () => {
    it('returns student data when the rut exists', async () => {
      const expectedStudent: Student = {
        id: 1,
        run: '12345678-9',
        nombre: 'Juan Pérez',
        curso: '4B',
        anioAcademico: 2026,
        activo: true,
      };

      mockedStudentService.getStudentByRut.mockResolvedValueOnce(expectedStudent);

      const response = await request(app).get('/students/by-rut').query({ run: '12345678-9' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedStudent);
      expect(mockedStudentService.getStudentByRut).toHaveBeenCalledWith('12345678-9');
    });

    it('returns 404 when the student does not exist', async () => {
      mockedStudentService.getStudentByRut.mockResolvedValueOnce(null);

      const response = await request(app).get('/students/by-rut').query({ run: '99999999-9' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Estudiante no encontrado' });
    });

    it('returns 400 when query parameter is missing', async () => {
      const response = await request(app).get('/students/by-rut');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "El parámetro 'run' es requerido y debe ser un string" });
    });
  });

  describe('GET /students/by-name', () => {
    it('returns student list when the name exists', async () => {
      const expectedStudents = [
        {
          id: 1,
          run: '12345678-9',
          nombre: 'Juan Pérez',
          curso: '4B',
          anioAcademico: 2026,
          activo: true,
        },
      ];

      mockedStudentService.getStudentByName.mockResolvedValueOnce(expectedStudents);

      const response = await request(app).get('/students/by-name').query({ nombre: 'Juan Pérez' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedStudents);
      expect(mockedStudentService.getStudentByName).toHaveBeenCalledWith('Juan Pérez');
    });

    it('returns multiple students when more than one name match exists', async () => {
      const expectedStudents = [
        {
          id: 1,
          run: '12345678-9',
          nombre: 'Juan Pérez',
          curso: '4B',
          anioAcademico: 2026,
          activo: true,
        },
        {
          id: 2,
          run: '98765432-1',
          nombre: 'Juan Pérez',
          curso: '3A',
          anioAcademico: 2026,
          activo: true,
        },
      ];

      mockedStudentService.getStudentByName.mockResolvedValueOnce(expectedStudents);

      const response = await request(app).get('/students/by-name').query({ nombre: 'Juan Pérez' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(expectedStudents);
      expect(mockedStudentService.getStudentByName).toHaveBeenCalledWith('Juan Pérez');
    });

    it('returns 404 when no students are found', async () => {
      mockedStudentService.getStudentByName.mockResolvedValueOnce([]);

      const response = await request(app).get('/students/by-name').query({ nombre: 'No Existe' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'No se encontraron estudiantes con ese nombre' });
    });

    it('returns 400 when query parameter is missing', async () => {
      const response = await request(app).get('/students/by-name');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "El parámetro 'nombre' es requerido y debe ser un string" });
    });
  });
});
