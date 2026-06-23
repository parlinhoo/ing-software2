import request from 'supertest';
import app from '@src/server';

describe('POST /incident - validaciones de API', () => {

  it('retorna 201 y el id al crear un incidente válido', async () => {
    const res = await request(app)
      .post('/incident')
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: '2026-05-01',
        place: 'Sala 1A',
        description: 'Insultos entre estudiantes',
        actors: [],
      });
    expect(res.status).toBe(201);
    expect(res.body.incidentId).toBeDefined();
  });

  it('retorna 400 si la fecha es futura', async () => {
    const res = await request(app)
      .post('/incident')
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: '2030-01-01',
        place: 'Sala 1A',
        description: 'Insultos entre estudiantes',
        actors: [],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si falta el campo place', async () => {
    const res = await request(app)
      .post('/incident')
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: '2026-05-01',
        description: 'Insultos entre estudiantes',
        actors: [],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si falta el campo description', async () => {
    const res = await request(app)
      .post('/incident')
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: '2026-05-01',
        place: 'Sala 1A',
        actors: [],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si el payload está vacío', async () => {
    const res = await request(app)
      .post('/incident')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('fecha de hoy es aceptada', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/incident')
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: today,
        place: 'Sala 1A',
        description: 'Insultos entre estudiantes',
        actors: [],
      });
    expect(res.status).toBe(201);
    expect(res.body.incidentId).toBeDefined();
  });

  it('el incidente creado aparece en GET /incident', async () => {
    // Usa el flujo con persistencia en BD (POST /incident/register),
    // ya que GET /incident ahora lee de la base de datos, no de memoria.
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const post = await request(app)
      .post('/incident/register')
      .send({
        registerer: '7',
        incidentType: 'Agresión verbal',
        severity: 'Leve',
        date: ayer,
        place: 'Patio',
        description: 'Empujones',
        actors: [],
      });
    const id = post.body.incidentId; // string (BigInt serializado)

    const get = await request(app).get('/incident');
    const incidents = JSON.parse(get.text);
    const ids = incidents.map((i: { id: string }) => i.id);
    expect(ids).toContain(id);
  });

});
