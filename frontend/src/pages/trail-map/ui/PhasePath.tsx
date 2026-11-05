import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { TrailMapPhase } from '@/shared/api/trailMapApi';
import { colors } from '@/shared/config/theme';
import {
  isSegmentReached,
  layoutPhasePath,
  PATH_WIDTH,
  segmentPath,
} from '../trailMapLayout';
import { PhaseNode } from './PhaseNode';

interface PhasePathProps {
  phases: TrailMapPhase[];
  onPress: (phase: TrailMapPhase) => void;
}

/**
 * Fases de uma unidade sobre o trilho. O trecho já percorrido é sólido e o
 * que falta, tracejado — como a estrada do Stitch.
 */
export function PhasePath({ phases, onPress }: PhasePathProps) {
  const layout = useMemo(() => layoutPhasePath(phases), [phases]);

  return (
    <View style={[styles.container, { height: layout.height }]}>
      <Svg width={PATH_WIDTH} height={layout.height} style={StyleSheet.absoluteFill}>
        {layout.points.slice(1).map((to, index) => {
          const from = layout.points[index];
          const next = phases[index + 1];
          if (!from || !next) return null;
          const reached = isSegmentReached(next);
          return (
            <Path
              key={next.id}
              d={segmentPath(from, to)}
              stroke={reached ? colors.primary : colors.lockedNode}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={reached ? undefined : '14 12'}
              strokeOpacity={reached ? 0.85 : 0.7}
              fill="none"
            />
          );
        })}
      </Svg>

      {layout.rows.map((row, index) => {
        const phase = phases[index];
        if (!phase) return null;
        return (
          <View
            key={phase.id}
            style={[styles.row, { top: row.top, transform: [{ translateX: row.offset }] }]}
          >
            <PhaseNode phase={phase} indexInUnit={index} onPress={onPress} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: PATH_WIDTH, alignSelf: 'center', marginTop: 20 },
  row: { position: 'absolute', left: 0, width: PATH_WIDTH, alignItems: 'center' },
});
