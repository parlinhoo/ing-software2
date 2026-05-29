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
    const post = await request(app)
      .post('/incident')
      .send({
        incidentType: 'physical',
        severity: 'mild',
        date: '2026-05-01',
        place: 'Patio',
        description: 'Empujones',
        actors: [],
      });
    const id = post.body.incidentId;

    const get = await request(app).get('/incident');
    const incidents = JSON.parse(get.text);
    const ids = incidents.map((i: { incidentId: number }) => i.incidentId);
    expect(ids).toContain(id);
  });

});
