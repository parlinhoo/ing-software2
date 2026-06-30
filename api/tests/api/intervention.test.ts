import request from 'supertest';
import app from '@src/server';
import { prisma } from '../support/agent';
import { generateUserJWT } from '@src/auth/authService';

const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

describe('T-15 - POST /intervention', () => {

  // Orientador Andrea: userId 5, roleId 4 (según seed)
  const tokenOrientador = generateUserJWT(5, 4);
  // Inspector Juan: userId 7, roleId 3 (crea incidentes)
  const tokenInspector = generateUserJWT(7, 3);
  // Docente: roleId 2 (NO puede registrar intervenciones)
  const tokenDocente = generateUserJWT(15, 2);

  it('Test 1: crea la intervención asociada al incidente y al orientador autenticado', async () => {
    // Crear un incidente base (lo registra un Inspector)
    const incRes = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
      .send({
        registerer: '7',
        incidentType: 'Agresión verbal',
        severity: 'Leve',
        date: ayer,
        place: 'Sala 2B',
        description: 'Base para test intervención',
        actors: [],
      });
    const incidenteId = BigInt(incRes.body.incidentId);

    // Acción bajo prueba: el orientador registra la intervención
    const res = await request(app)
      .post('/intervention')
      .set('Authorization', `Bearer ${tokenOrientador}`)
      .send({
        incidenteId: incidenteId.toString(),
        tipo: 'Citación a apoderado',
        fecha: ayer,
        descripcion: 'Cita programada para el viernes',
      });

    expect(res.status).toBe(201);
    const intervencionId = BigInt(res.body.id);

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

  it('Test 2: rechaza con 400 si falta descripción', async () => {
    const res = await request(app)
      .post('/intervention')
      .set('Authorization', `Bearer ${tokenOrientador}`)
      .send({
        incidenteId: '1',
        tipo: 'Derivación',
        fecha: ayer,
        // descripcion omitida
      });
    expect(res.status).toBe(400);
  });

  it('Test 3: rechaza con 403 si el usuario no es orientador', async () => {
    const res = await request(app)
      .post('/intervention')
      .set('Authorization', `Bearer ${tokenDocente}`)
      .send({
        incidenteId: '1',
        tipo: 'Derivación',
        fecha: ayer,
        descripcion: 'No debería pasar',
      });
    expect(res.status).toBe(403);
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});