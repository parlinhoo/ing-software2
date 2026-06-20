import request from 'supertest';
import { prisma } from '../support/agent';
import app from '@src/server';

const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

async function crearIncidenteBase(descripcion: string): Promise<bigint> {
  const res = await request(app)
    .post('/incident/register')
    .send({
      registerer: '7',
      incidentType: 'Agresión verbal',
      severity: 'Leve',
      date: ayer,
      place: 'Sala 3A',
      description: descripcion,
      actors: [],
    });
  return BigInt(res.body.incidentId);
}

describe('T-12 - DELETE /incident/:id (eliminación lógica)', () => {

  it('Test 1: marca el incidente como anulado y guarda el motivo', async () => {
    const incidenteId = await crearIncidenteBase('Base para test anulación');

    const res = await request(app)
      .delete(`/incident/${incidenteId.toString()}`)
      .send({ motivo: 'Ingresado por error' });

    expect(res.status).toBe(200);

    const incidente = await prisma.incidente.findUnique({
      where: { id: incidenteId },
    });
    expect(incidente).not.toBeNull();
    expect(incidente!.anulado).toBe(true);
    expect(incidente!.motivoAnulacion).toBe('Ingresado por error');

    // Limpieza
    await prisma.incidente.delete({ where: { id: incidenteId } });
  });

  it('Test 2: los incidentes anulados no aparecen en GET /incident', async () => {
    const incidenteId = await crearIncidenteBase('Incidente que será anulado');

    // Anularlo
    await request(app)
      .delete(`/incident/${incidenteId.toString()}`)
      .send({ motivo: 'Prueba de filtrado' });

    // Consultar listado
    const res = await request(app).get('/incident');
    expect(res.status).toBe(200);

    const ids = res.body.map((i: { id: string }) => i.id);
    expect(ids).not.toContain(incidenteId.toString());

    // Limpieza
    await prisma.incidente.delete({ where: { id: incidenteId } });
  });

  it.todo('Test 3: rechaza con 403 si el usuario no es directivo (post-T03)');
});

afterAll(async () => {
  await prisma.$disconnect();
});