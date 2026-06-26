// Valida si una fecha en formato YYYY-MM-DD (o cualquier formato parseable por Date)
// representa un día posterior al dia de hoy, usando comparacion por componentes UTC.
// Esto evita el bug de zona horaria: `new Date("2026-06-26")` se parsea como medianoche UTC,
// mientras que `new Date()` está en la zona local. Comparar mezclando ambas lleva a falsos positivos
// en husos negativos (Chile UTC-3/-4), donde la fecha de "hoy" local parece "futuro" en UTC.
export function isFechaFutura(input: string | Date): boolean {
  const fecha = typeof input === 'string' ? new Date(input) : input;
  const hoy = new Date();

  // Comparar año/mes/día en UTC en ambos lados.
  const fY = fecha.getUTCFullYear();
  const fM = fecha.getUTCMonth();
  const fD = fecha.getUTCDate();

  const hY = hoy.getUTCFullYear();
  const hM = hoy.getUTCMonth();
  const hD = hoy.getUTCDate();

  if (fY !== hY) return fY > hY;
  if (fM !== hM) return fM > hM;
  return fD > hD;
}