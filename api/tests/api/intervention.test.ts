import request from 'supertest';
import { prisma } from '../support/agent';
import app from '@src/server';

const today = new Date().toISOString().split('T')[0];

describe('T-15 - POST /intervention', () => {

  it('Test 1: crea la intervención asociada al incidente y al orientador', async () => {
    // Crear un incidente base para asociar
    const incRes = await request(app)
      .post('/incident/register')
      .send({
        registerer: '7',
        incidentType: 'Agresión verbal',
        severity: 'Leve',
        date: today,
        place: 'Sala 2B',
        description: 'Base para test intervención',
        actors: [],
      });
    const incidenteId = BigInt(incRes.body.incidentId);

    // Acción bajo prueba
    const res = await request(app)
      .post('/intervention')
      .send({
        incidenteId: incidenteId.toString(),
        realizadaPor: '5',
        tipo: 'Citación a apoderado',
        fecha: today,
        descripcion: 'Cita programada para el viernes',
      });

    expect(res.status).toBe(201);
    const intervencionId = BigInt(res.body.interventionId);

    const intervencion = await prisma.intervencion.findUnique({
      where: { id: intervencionId },
    });
    expect(intervencion).not.toBeNull();
    expect(intervencion!.incidenteId).toBe(incidenteId);
    expect(intervencion!.realizadaPorId).toBe(BigInt(5));

    // Limpieza
    await prisma.intervencion.delete({ where: { id: intervencionId } });
    await prisma.incidente.delete({ where: { id: incidenteId } });
  });

  it('Test 2: rechaza si falta descripción', async () => {
    const res = await request(app)
      .post('/intervention')
      .send({
        incidenteId: '1',
        realizadaPor: '5',
        tipo: 'Derivación',
        fecha: today,
        // descripcion omitida
      });
    expect(res.status).toBe(400);
  });

  it.todo('Test 3: rechaza con 403 si el usuario no es orientador (post-T03)');
});

afterAll(async () => {
  await prisma.$disconnect();
});