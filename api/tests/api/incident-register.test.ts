import request from 'supertest';
import { prisma } from '../support/agent';
import app from '@src/server';


const today = new Date().toISOString().split('T')[0];
// ─── T05 ────────────────────────────────────────────────────────────────────

describe('T05 - Selector de gravedad', () => {

  it('Test 1: la BD refleja la gravedad correcta vinculada al ID del incidente', async () => {
    const res = await request(app)
      .post('/incident/register')
      .send({
        registerer: '7',
        incidentType: 'Agresión verbal',
        severity: 'Leve',
        date: today,
        place: 'Sala 1A',
        description: 'Insultos',
        actors: [],
      });

    expect(res.status).toBe(201);
    const incidenteId = BigInt(res.body.incidentId);

    // Verificar que la gravedad guardada es "Leve" (nivel 1)
    const incidente = await prisma.incidente.findUnique({
      where: { id: incidenteId },
      include: { gravedad: true },
    });
    expect(incidente).not.toBeNull();
    expect(incidente!.gravedad.nombre).toBe('Leve');

    // Limpieza
    await prisma.incidente.delete({ where: { id: incidenteId } });
  });

  it('Test 2: rechaza el envío si falta el campo severity', async () => {
    const res = await request(app)
      .post('/incident/register')
      .send({
        registerer: '7',
        incidentType: 'Agresión verbal',
        // severity omitido intencionalmente
        date: today,
        place: 'Sala 1A',
        description: 'Insultos',
        actors: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

});

// ─── T07 ────────────────────────────────────────────────────────────────────

describe('T07 - Involucrados y roles en tabla relacional', () => {

  it('Test 1: guardado atómico - 1 incidente y 2 participaciones con el mismo ID', async () => {
    const res = await request(app)
      .post('/incident/register')
      .send({
        registerer: '7',
        incidentType: 'Agresión física',
        severity: 'Grave',
        date: today,
        place: 'Patio',
        description: 'Empujones',
        actors: [
          { estudianteId: 1, role: 'Agresor' },
          { estudianteId: 2, role: 'Víctima' },
        ],
      });

    expect(res.status).toBe(201);
    const incidenteId = BigInt(res.body.incidentId);

    const participaciones = await prisma.participacionEnIncidente.findMany({
      where: { incidenteId },
    });

    // 2 registros en la tabla intermedia, ambos con el mismo incidenteId
    expect(participaciones).toHaveLength(2);
    participaciones.forEach((p: { incidenteId: bigint }) => expect(p.incidenteId).toBe(incidenteId));

    // Limpieza
    await prisma.participacionEnIncidente.deleteMany({ where: { incidenteId } });
    await prisma.incidente.delete({ where: { id: incidenteId } });
  });

  it('Test 2: rollback completo si estudianteId no existe - no queda nada en BD', async () => {
    const res = await request(app)
      .post('/incident/register')
      .send({
        registerer: '7',
        incidentType: 'Agresión física',
        severity: 'Grave',
        date: today,
        place: 'Patio rollback',
        description: 'Test rollback',
        actors: [
          { estudianteId: 99999, role: 'Agresor' }, // FK inválida → fuerza error
        ],
      });

    // El backend debe retornar 500
    expect(res.status).toBe(500);

    // El incidente NO debe haber quedado guardado (rollback completo)
    const incidentes = await prisma.incidente.findMany({
      where: { lugar: 'Patio rollback', descripcion: 'Test rollback' },
    });
    expect(incidentes).toHaveLength(0);
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});