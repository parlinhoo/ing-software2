import { prisma } from '../support/agent';

describe('Intervencion - validaciones de base de datos', () => {

  it('falla si incidenteId no existe', async () => {
    await expect(
      prisma.intervencion.create({
        data: {
          incidenteId: BigInt(999),
          realizadaPorId: BigInt(5),
          fecha: new Date('2026-05-01'),
          tipo: 'Citación a apoderado',
          descripcion: 'Test intervención',
        },
      })
    ).rejects.toThrow();
  });

  it('crea una intervención válida correctamente', async () => {
    const intervencion = await prisma.intervencion.create({
      data: {
        incidenteId: BigInt(1),
        realizadaPorId: BigInt(5),
        fecha: new Date('2026-05-01'),
        tipo: 'Citación a apoderado',
        descripcion: 'Test intervención',
      },
    });
    expect(intervencion.id).toBeDefined();
    await prisma.intervencion.delete({ where: { id: intervencion.id } });
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});
