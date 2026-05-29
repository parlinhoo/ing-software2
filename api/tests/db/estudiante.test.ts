import { prisma } from '../support/agent';

describe('Estudiante - validaciones de base de datos', () => {

  it('falla si se registra un RUN duplicado', async () => {
    await expect(
      prisma.estudiante.create({
        data: {
          run: '23835243-6', // ya existe en el seed
          nombre: 'Estudiante Duplicado',
          curso: '1°A Medio',
          anioAcademico: 2026,
        },
      })
    ).rejects.toThrow();
  });

  it('crea un estudiante válido correctamente', async () => {
    const estudiante = await prisma.estudiante.create({
      data: {
        run: '99999999-9',
        nombre: 'Estudiante Test',
        curso: '1°A Medio',
        anioAcademico: 2026,
      },
    });
    expect(estudiante.id).toBeDefined();
    expect(estudiante.activo).toBe(true);
    await prisma.estudiante.delete({ where: { id: estudiante.id } });
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});
