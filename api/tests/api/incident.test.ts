import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '@src/server';
import { prisma } from '../support/agent';
import { generateUserJWT } from '@src/auth/authService';

// Inspector Juan: userId 7, roleId 3. Autorizado a registrar incidentes.
const tokenInspector = generateUserJWT(7, 3);

// El endpoint en memoria POST /incident fue eliminado; estos tests usan el
// endpoint real con persistencia POST /incident/register (mismas validaciones).
describe('POST /incident/register - validaciones de API', () => {

  // Guardamos ids creados para limpiarlos al final.
  const creados: string[] = [];

  it('retorna 201 y el id al crear un incidente válido', async () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: ayer,
        place: 'Sala 1A',
        description: 'Insultos entre estudiantes',
        actors: [],
      });
    expect(res.status).toBe(201);
    expect(res.body.incidentId).toBeDefined();
    if (res.body.incidentId) creados.push(res.body.incidentId);
  });

  it('retorna 400 si la fecha es futura', async () => {
    const res = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
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
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: ayer,
        description: 'Insultos entre estudiantes',
        actors: [],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si falta el campo description', async () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
      .send({
        incidentType: 'verbal',
        severity: 'severe',
        date: ayer,
        place: 'Sala 1A',
        actors: [],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si el payload está vacío', async () => {
    const res = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('fecha de hoy es aceptada', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
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
    if (res.body.incidentId) creados.push(res.body.incidentId);
  });

  it('el incidente creado aparece en GET /incident', async () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const post = await request(app)
      .post('/incident/register')
      .set('Authorization', `Bearer ${tokenInspector}`)
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
    if (id) creados.push(id);

    const get = await request(app).get('/incident').set('Authorization', `Bearer ${tokenInspector}`);
    const incidents = JSON.parse(get.text);
    const ids = incidents.map((i: { id: string }) => i.id);
    expect(ids).toContain(id);
  });

  // Limpia los incidentes creados por estos tests.
  afterAll(async () => {
    for (const id of creados) {
      await prisma.incidente.deleteMany({ where: { id: BigInt(id) } });
    }
    await prisma.$disconnect();
  });

});