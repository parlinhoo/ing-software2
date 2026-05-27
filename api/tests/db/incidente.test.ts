import { prisma } from '../support/agent';

describe('Incidente - validaciones de base de datos', () => {

  // Test 1: no se puede crear un incidente sin gravedadId
  it('falla si falta gravedadId', async () => {
    await expect(
      prisma.incidente.create({
        data: {
          fecha: new Date('2026-05-01'),
          lugar: 'Patio',
          descripcion: 'Test',
          gravedadId: BigInt(999), // ID inexistente
          tipoIncidenteId: BigInt(1),
          estadoCasoId: BigInt(1),
          registradoPorId: BigInt(7),
        },
      })
    ).rejects.toThrow();
  });

  // Test 2: no se puede crear un incidente con tipoIncidenteId inexistente
  it('falla si tipoIncidenteId no existe', async () => {
    await expect(
      prisma.incidente.create({
        data: {
          fecha: new Date('2026-05-01'),
          lugar: 'Patio',
          descripcion: 'Test',
          gravedadId: BigInt(1),
          tipoIncidenteId: BigInt(999), // ID inexistente
          estadoCasoId: BigInt(1),
          registradoPorId: BigInt(7),
        },
      })
    ).rejects.toThrow();
  });

  // Test 3: no se puede crear un incidente con registradoPorId inexistente
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
          registradoPorId: BigInt(999), // ID inexistente
        },
      })
    ).rejects.toThrow();
  });

  // Test 4: se puede crear un incidente válido
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

    // Limpiar después del test
    await prisma.incidente.delete({ where: { id: incidente.id } });
  });

  // Test 5: un estudiante no puede tener el mismo rol en el mismo incidente dos veces
  it('falla si se duplica la participación de un estudiante en un incidente', async () => {
    await expect(
      prisma.participacionEnIncidente.create({
        data: {
          incidenteId: BigInt(1),
          estudianteId: BigInt(87), // ya existe en el seed
          rolEnConflictoId: BigInt(1),
        },
      })
    ).rejects.toThrow();
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});
