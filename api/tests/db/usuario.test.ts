import { prisma } from '../support/agent';

describe('Usuario - validaciones de base de datos', () => {

  it('falla si se registra un correo duplicado', async () => {
    await expect(
      prisma.usuario.create({
        data: {
          nombre: 'Usuario Duplicado',
          correo: 'admin.carlos@liceosanlorenzo.cl', // ya existe en el seed
          contrasenaHash: 'hash123',
          rolId: BigInt(1),
        },
      })
    ).rejects.toThrow();
  });

  it('crea un usuario válido correctamente', async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nombre: 'Usuario Test',
        correo: 'test.unico@liceosanlorenzo.cl',
        contrasenaHash: 'hash123',
        rolId: BigInt(1),
      },
    });
    expect(usuario.id).toBeDefined();
    expect(usuario.activo).toBe(true);
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });

});

afterAll(async () => {
  await prisma.$disconnect();
});
