// src/modules/events/utils/geo.ts
const RMR_CITIES = [
  "recife", "olinda", "jaboatao", "jaboatão", "paulista",
  "camaragibe", "sao lourenco", "são lourenço", "igarassu",
  "abreu e lima", "cabo de santo agostinho", "moreno", "ilha de itamaraca",
];

export function isInRecifeMetro(location: string): boolean {
  const t = location.toLocaleLowerCase("pt-BR");
  return RMR_CITIES.some((c) => t.includes(c));
}