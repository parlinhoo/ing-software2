import { prisma } from '../support/agent';

describe('AnotacionPositiva - validaciones de base de datos', () => {

  it('el campo compensada es false por defecto', async () => {
    const anotacion = await prisma.anotacionPositiva.create({
      data: {
        estudianteId: BigInt(1),
        registradaPorId: BigInt(14),
        fecha: new Date('2026-05-01'),
        descripcion: 'Anotación de prueba',
      },
    });
    expect(anotacion.compensada).toBe(false);
    await prisma.anotacionPositiva.delete({ where: { id: anotacion.id } });
  });

  it('falla si estudianteId no existe', async () => {
    await expect(
      prisma.anotacionPositiva.create({
        data: {
          estudianteId: BigInt(999),
          registradaPorId: BigInt(14),
          fecha: new Date('2026-05-01'),
          descripcion: 'Anotación de prueba',
        },
      })
    ).rejects.toThrow();
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});
