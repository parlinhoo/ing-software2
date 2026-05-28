import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Busca un estudiante por RUT (búsqueda exacta)
 */
export async function getStudentByRut(run: string) {
  try {
    const student = await prisma.estudiante.findUnique({
      where: { run },
      select: {
        id: true,
        run: true,
        nombre: true,
        curso: true,
        anioAcademico: true,
        activo: true,
      },
    });
    return student;
  } catch (error) {
    console.error('Error getStudentByRut', error);
    throw error;
  }
}

/**
 * Busca estudiantes por nombre (búsqueda exacta)
 */
export async function getStudentByName(nombre: string) {
  try {
    const students = await prisma.estudiante.findMany({
      where: { nombre },
      select: {
        id: true,
        run: true,
        nombre: true,
        curso: true,
        anioAcademico: true,
        activo: true,
      },
    });
    return students;
  } catch (error) {
    console.error('Error getStudentByName', error);
    throw error;
  }
}
