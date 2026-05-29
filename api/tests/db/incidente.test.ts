import { prisma } from '../support/agent';

describe('Incidente - validaciones de base de datos', () => {

  it('falla si falta gravedadId', async () => {
    await expect(
      prisma.incidente.create({
        data: {
          fecha: new Date('2026-05-01'),
          lugar: 'Patio',
          descripcion: 'Test',
          gravedadId: BigInt(999),
          tipoIncidenteId: BigInt(1),
          estadoCasoId: BigInt(1),
          registradoPorId: BigInt(7),
        },
      })
    ).rejects.toThrow();
  });

  it('falla si tipoIncidenteId no existe', async () => {
    await expect(
      prisma.incidente.create({
        data: {
          fecha: new Date('2026-05-01'),
          lugar: 'Patio',
          descripcion: 'Test',
          gravedadId: BigInt(1),
          tipoIncidenteId: BigInt(999),
          estadoCasoId: BigInt(1),
          registradoPorId: BigInt(7),
        },
      })
    ).rejects.toThrow();
  });

  it('falla si registradoPorId no existe', async () => {
    await expect(
      prisma.incidente.create({
        data: {
          fecha: new Date('2026-05-01'),
          lugar: 'Patio',
          descripcion: 'Test',
          gravedadId: BigInt(1),
          tipoIncidenteId: BigInt(1),
          estadoCasoId: BigInt(1),
          registradoPorId: BigInt(999),
        },
      })
    ).rejects.toThrow();
  });

  it('crea un incidente válido correctamente', async () => {
    const incidente = await prisma.incidente.create({
      data: {
        fecha: new Date('2026-05-01'),
        lugar: 'Sala 1A',
        descripcion: 'Incidente de prueba',
        gravedadId: BigInt(1),
        tipoIncidenteId: BigInt(1),
        estadoCasoId: BigInt(1),
        registradoPorId: BigInt(7),
      },
    });
    expect(incidente.id).toBeDefined();
    expect(incidente.lugar).toBe('Sala 1A');
    await prisma.incidente.delete({ where: { id: incidente.id } });
  });

  it('falla si se duplica la participación de un estudiante en un incidente', async () => {
    await expect(
      prisma.participacionEnIncidente.create({
        data: {
          incidenteId: BigInt(1),
          estudianteId: BigInt(87),
          rolEnConflictoId: BigInt(1),
        },
      })
    ).rejects.toThrow();
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});
