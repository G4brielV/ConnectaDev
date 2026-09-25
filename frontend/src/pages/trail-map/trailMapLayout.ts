/** Deslocamento horizontal dos nós, para o caminho serpentear como no Stitch. */
const OFFSETS = [0, 58, 82, 58, 0, -58, -82, -58];

export function phaseOffset(index: number): number {
  return OFFSETS[index % OFFSETS.length] ?? 0;
}
