import type { PhaseStatus, TrailMapUnit } from '@/shared/api/trailMapApi';

/**
 * Geometria do caminho do mapa. Os nós ficam em linhas de altura fixa para
 * que o trilho em SVG, desenhado por trás, passe exatamente pelo centro de
 * cada um — o React Native não mede a posição dos nós a tempo de desenhar.
 */
export const PATH_WIDTH = 320;
/** Área do nó (inclui o halo da fase atual e o selo de estrelas). */
export const NODE_SLOT = 96;
/** Rótulo abaixo do nó, com espaço para duas linhas. */
export const LABEL_SLOT = 52;
/** Espaço extra acima da fase atual para o balão "COMEÇAR!". */
export const BUBBLE_SLOT = 40;
export const ROW_GAP = 6;

/** Deslocamento horizontal dos nós, para o caminho serpentear como no Stitch. */
const OFFSETS = [0, -62, -20, 48, 70, 24, -44, -70];

export function phaseOffset(index: number): number {
  return OFFSETS[index % OFFSETS.length] ?? 0;
}

export interface PathRow {
  top: number;
  height: number;
  offset: number;
  hasBubble: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface PathLayout {
  rows: PathRow[];
  /** Centro de cada nó, em coordenadas do contêiner do caminho. */
  points: PathPoint[];
  height: number;
}

export function layoutPhasePath(
  phases: ReadonlyArray<{ status: PhaseStatus }>,
  width: number = PATH_WIDTH,
): PathLayout {
  const rows: PathRow[] = [];
  const points: PathPoint[] = [];
  let top = 0;

  phases.forEach((phase, index) => {
    const hasBubble = phase.status === 'current';
    const offset = phaseOffset(index);
    const height = (hasBubble ? BUBBLE_SLOT : 0) + NODE_SLOT + LABEL_SLOT;

    rows.push({ top, height, offset, hasBubble });
    points.push({
      x: width / 2 + offset,
      y: top + (hasBubble ? BUBBLE_SLOT : 0) + NODE_SLOT / 2,
    });
    top += height + ROW_GAP;
  });

  return { rows, points, height: Math.max(0, top - ROW_GAP) };
}

/**
 * Curva em S entre dois nós: as alças verticais saem e chegam na metade do
 * caminho, o que dá o traço suave de "estrada" do Stitch.
 */
export function segmentPath(from: PathPoint, to: PathPoint): string {
  const middleY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${to.y}`;
}

/** O trecho até uma fase fica "percorrido" quando ela já está liberada. */
export function isSegmentReached(next: { status: PhaseStatus }): boolean {
  return next.status !== 'locked';
}

const KIND_PREFIX = /^(Baú Bônus|Chefão)\s*:\s*/i;

/**
 * Rótulo do nó. Fases comuns ganham a posição na unidade ("3. Funções");
 * bônus e chefão já têm selo próprio, então o prefixo do título sai.
 */
export function phaseLabel(title: string, kind: string, indexInUnit: number): string {
  if (kind === 'BONUS' || kind === 'BOSS') return title.replace(KIND_PREFIX, '');
  return `${indexInUnit + 1}. ${title}`;
}

/**
 * Unidade em destaque: a da fase atual; sem fase atual (trilha terminada ou
 * só com bônus pendente), a primeira ainda incompleta, ou então a última.
 */
export function focusedUnitId(units: TrailMapUnit[], currentPhaseId: string | null): string | null {
  if (units.length === 0) return null;
  const withCurrent = units.find((unit) =>
    unit.phases.some((phase) => phase.id === currentPhaseId),
  );
  if (withCurrent) return withCurrent.id;
  const incomplete = units.find((unit) => unit.completedPhases < unit.totalPhases);
  return (incomplete ?? units[units.length - 1]).id;
}

export type UnitState = 'done' | 'active' | 'locked';

/**
 * Quais unidades começam abertas: a em foco e a seguinte (prévia do que vem).
 * Concluídas e as bloqueadas mais distantes ficam recolhidas.
 */
export function isUnitExpandedByDefault(unitIndex: number, focusedIndex: number): boolean {
  return unitIndex === focusedIndex || unitIndex === focusedIndex + 1;
}

export function unitState(unit: TrailMapUnit): UnitState {
  if (unit.totalPhases > 0 && unit.completedPhases === unit.totalPhases) return 'done';
  return unit.phases.some((phase) => phase.status !== 'locked') ? 'active' : 'locked';
}
