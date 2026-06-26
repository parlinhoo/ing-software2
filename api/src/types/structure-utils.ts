/**
 * Utilidades de tipos genéricos.
 */

// Valor de cualquier propiedad de un objeto/const.
export type ValueOf<T> = T[keyof T];
