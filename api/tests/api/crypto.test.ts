import { bcryptHash, bcryptCompare } from '@src/crypto/cryptoService';
import { describe, it, expect } from 'vitest';

describe('Funciones de Bcrypt', () => {
  const password = 'password123@!';

  it('debería hashear el texto y generar un string distinto con el formato correcto', async () => {
    const hash = await bcryptHash(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(password);
  });

  it('debería devolver true al comparar la contraseña correcta con su hash', async () => {
    const hash = await bcryptHash(password);
    const comparacionExitosa = await bcryptCompare(password, hash);

    expect(comparacionExitosa).toBe(true);
  });

  it('debería devolver false al comparar una contraseña incorrecta con el hash', async () => {
    const hash = await bcryptHash(password);
    const incorrectPass = 'password123@';
    const comparacionFallida = await bcryptCompare(incorrectPass, hash);

    expect(comparacionFallida).toBe(false);
  });
});