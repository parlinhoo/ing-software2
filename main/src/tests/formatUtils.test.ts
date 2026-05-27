import { describe, expect, test } from "vitest"
import {getStudentClassOptionsRegex, isValidRut} from "../utils/formatUtils.ts"

describe("isValidRut", () => {
    test("devuelve verdadero al pasar rut válidos", () => {
        expect.soft(isValidRut("21.411.671-5")).toBe(true);
        expect.soft(isValidRut("21411671-5")).toBe(true);
        expect.soft(isValidRut("9.932.495-3")).toBe(true);
        expect.soft(isValidRut("9932495-3")).toBe(true);
    })

    test("devuelve verdadero al pasar rut válidos terminados en K", () => {
        expect.soft(isValidRut("15.000.005-K")).toBe(true);
        expect.soft(isValidRut("11111112-k")).toBe(true);
    });

    test("devuelve verdadero al pasar rut válidos terminados en 0", () => {
        expect.soft(isValidRut("12.345.675-0")).toBe(true);
        expect.soft(isValidRut("12345675-0")).toBe(true);
        expect.soft(isValidRut("5.555.554-0")).toBe(true);
        expect.soft(isValidRut("5555554-0")).toBe(true);
    });

    test("devuelve falso al pasar rut con dígito verificador incorrecto", () => {
        expect.soft(isValidRut("21.411.671-4")).toBe(false);
        expect.soft(isValidRut("9.932.495-1")).toBe(false);
        expect.soft(isValidRut("19.876.543-9")).toBe(false);
        expect.soft(isValidRut("19.876.543-K")).toBe(false);
    });

    test("devuelve falso al pasar cadenas con formato inválido o incompletas", () => {
        expect.soft(isValidRut("21.411.671")).toBe(false); 
        expect.soft(isValidRut("21411671")).toBe(false); 
        expect.soft(isValidRut("1234567-89")).toBe(false); 
        expect.soft(isValidRut("rut-invalido")).toBe(false);
        expect.soft(isValidRut("")).toBe(false);
    });

    test("devuelve falso al pasar rut con formato correcto pero letras intercaladas", () => {
        expect.soft(isValidRut("21.A11.671-5")).toBe(false);
        expect.soft(isValidRut("21A11671-5")).toBe(false);
        expect.soft(isValidRut("9.932.49A-3")).toBe(false);
        expect.soft(isValidRut("12.3A5.675-0")).toBe(false);
        expect.soft(isValidRut("AB.CDE.FGH-I")).toBe(false);
    });

    test("devuelve falso al pasar rut con formato correcto pero caracteres especiales en el cuerpo", () => {
        expect.soft(isValidRut("21.411.67!-5")).toBe(false);
        expect.soft(isValidRut("9.932_495-3")).toBe(false);
        expect.soft(isValidRut("19.876?543-K")).toBe(false);
    });

    test("devuelve falso al pasar rut con formato de puntos mal ubicados o bloques de números inválidos", () => {
        expect.soft(isValidRut("2.1411.671-5")).toBe(false);
        expect.soft(isValidRut("21.411.6712-5")).toBe(false);
        
        expect.soft(isValidRut("21.41.671-5")).toBe(false);
        expect.soft(isValidRut("9.93.495-3")).toBe(false);
        
        expect.soft(isValidRut("21..411.671-5")).toBe(false);
        expect.soft(isValidRut("21.411.671-5-5")).toBe(false);
        expect.soft(isValidRut("21.411.671--5")).toBe(false);
    });
});

// no es una prueba obligatoria, es solo para probar el regex
describe("getStudentClassFromString", () => {
    test("devuelve los códigos correctos para cursos explícitos", () => {
        expect.soft(getStudentClassOptionsRegex("2° Básico B")).toEqual(["2° Básico B"]);
        expect.soft(getStudentClassOptionsRegex("8vo basico c")).toEqual(["8° Básico C"]);
        expect.soft(getStudentClassOptionsRegex("5bB")).toEqual(["5° Básico B"]); 

        expect.soft(getStudentClassOptionsRegex("2° Medio B")).toEqual(["2° Medio B"]);
        expect.soft(getStudentClassOptionsRegex("4to medio a")).toEqual(["4° Medio A"]);
        expect.soft(getStudentClassOptionsRegex("1mC")).toEqual(["1° Medio C"]);
    });

    test("devuelve ambas opciones (Básica y Media) cuando hay ambiguedad en cursos del 1 al 4", () => {
        expect.soft(getStudentClassOptionsRegex("2°B")).toEqual(["2° Básico B", "2° Medio B"]);
        expect.soft(getStudentClassOptionsRegex("4 A")).toEqual(["4° Básico A", "4° Medio A"]);
        expect.soft(getStudentClassOptionsRegex("1-C")).toEqual(["1° Básico C", "1° Medio C"]);
        expect.soft(getStudentClassOptionsRegex("3ro D")).toEqual(["3° Básico D", "3° Medio D"]);
    });

    test("devuelve solo Básica cuando hay ambigüedad pero el número es de 5 a 8", () => {
        expect.soft(getStudentClassOptionsRegex("7B")).toEqual(["7° Básico B"]);
        expect.soft(getStudentClassOptionsRegex("8° A")).toEqual(["8° Básico A"]);
        expect.soft(getStudentClassOptionsRegex("5 C")).toEqual(["5° Básico C"]);
    });

    test("devuelve arreglo vacío para entradas inválidas, incompletas o fuera de rango", () => {
        expect.soft(getStudentClassOptionsRegex("9B")).toEqual([]);
        expect.soft(getStudentClassOptionsRegex("Medio B")).toEqual([]);
        expect.soft(getStudentClassOptionsRegex("Cualquier texto")).toEqual([]);
        expect.soft(getStudentClassOptionsRegex("")).toEqual([]);
    });
})