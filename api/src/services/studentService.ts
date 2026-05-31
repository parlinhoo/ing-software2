import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type StudentData = {
  rut: string,
  name: string,
  class: string,
}

export async function getStudentByRUN(run: string): Promise<StudentData|null> {
  try {
    const student = await prisma.estudiante.findUnique({
      where: { run },
      select: {
        run: true,
        nombre: true,
        curso: true,
      },
    });
    if (!student) return null;
    return {
      rut: student.run,
      name: student.nombre,
      class: student.curso,
    };
  } catch (error) {
    console.error('Error getStudentByRUN', error);
    throw error;
  }
}

export async function getStudentsByName(nombre: string): Promise<StudentData[]> {
  try {
    const students = await prisma.estudiante.findMany({
      where: {
        nombre: {
          contains: nombre,
          mode: 'insensitive',
        },
      },
      select: {
        run: true,
        nombre: true,
        curso: true,
      },
    });
    return students.map((student: {run: string, nombre: string, curso: string}) => {
      return {
        rut: student.run,
        name: student.nombre,
        class: student.curso,
      }
    });
  } catch (error) {
    console.error('Error getStudentByName', error);
    return [];
  }
}
