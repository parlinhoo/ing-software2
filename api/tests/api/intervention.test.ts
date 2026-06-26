import request from 'supertest';
import app from '@src/server';
import { prisma } from '../support/agent';

describe('Intervención - validaciones de API', () => {

  // Primero creamos un incidente para usarlo en los tests
  let incidentId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/incident')
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: '2026-05-01',
        place: 'Sala 1A',
        description: 'Incidente de prueba para intervenciones',
        actors: [],
      });
    incidentId = res.body.incidentId;
  });

  it('retorna 201 y el id al registrar una intervención válida', async () => {
    const res = await request(app)
      .put('/intervention')
      .send({
        registerer: 'orientador.andrea@liceosanlorenzo.cl',
        incidentId,
        date: '2026-05-02',
        interventionType: 'citation',
        description: 'Se citó al apoderado',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('retorna 400 si falta el campo description', async () => {
    const res = await request(app)
      .put('/intervention')
      .send({
        registerer: 'orientador.andrea@liceosanlorenzo.cl',
        incidentId,
        date: '2026-05-02',
        interventionType: 'citation',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si la fecha es futura', async () => {
    const res = await request(app)
      .put('/intervention')
      .send({
        registerer: 'orientador.andrea@liceosanlorenzo.cl',
        incidentId,
        date: '2030-01-01',
        interventionType: 'citation',
        description: 'Se citó al apoderado',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 404 si el incidenteId no existe', async () => {
    const res = await request(app)
      .put('/intervention')
      .send({
        registerer: 'orientador.andrea@liceosanlorenzo.cl',
        incidentId: 9999,
        date: '2026-05-02',
        interventionType: 'citation',
        description: 'Se citó al apoderado',
      });
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('GET /intervention retorna intervenciones en orden cronológico inverso', async () => {
    // Registrar dos intervenciones con fechas distintas
    await request(app).put('/intervention').send({
      registerer: 'orientador.andrea@liceosanlorenzo.cl',
      incidentId,
      date: '2026-05-01',
      interventionType: 'citation',
      description: 'Primera intervención',
    });
    await request(app).put('/intervention').send({
      registerer: 'orientador.andrea@liceosanlorenzo.cl',
      incidentId,
      date: '2026-05-10',
      interventionType: 'derivation',
      description: 'Segunda intervención',
    });

    const res = await request(app).get(`/intervention?incidentId=${incidentId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Verificar orden cronológico inverso
    const dates = res.body.map((i: { date: string }) => new Date(i.date).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('POST /intervention edita una intervención existente', async () => {
    // Crear intervención
    const create = await request(app).put('/intervention').send({
      registerer: 'orientador.andrea@liceosanlorenzo.cl',
      incidentId,
      date: '2026-05-02',
      interventionType: 'citation',
      description: 'Descripción original',
    });
    const interventionId = create.body.id;

    // Editar
    const edit = await request(app).post('/intervention').send({
      incidentId,
      interventionId,
      description: 'Descripción actualizada',
    });
    expect(edit.status).toBe(200);
    expect(edit.body.id).toBe(interventionId);
  });

  it('POST /intervention retorna 404 si la intervención no existe', async () => {
    const res = await request(app).post('/intervention').send({
      incidentId,
      interventionId: 9999,
      description: 'No existe',
    });
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

});

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