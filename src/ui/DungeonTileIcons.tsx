import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DungeonTileIconProps {
  size?: number;
  colour?: string;
  focused?: boolean;
}

const DEFAULT_SIZE = 24;

function getStyles(size: number, colour: string, focused: boolean) {
  const stroke = focused ? colour : '#5E5A54';
  const strokeWidth = focused ? 2.2 : 1.6;
  const bg = focused ? colour + '22' : 'transparent'; // 22 = ~13% opacity hex
  return { stroke, strokeWidth, bg, size };
}

export function KeepIcon({ size = DEFAULT_SIZE, colour = '#800000', focused = false }: DungeonTileIconProps) {
  const s = getStyles(size, colour, focused);
  return (
    <View style={[iconStyles.container, { width: s.size, height: s.size }]} >
      {/* Keep / Castle shape */}
      <View style={[iconStyles.keepBody, { borderColor: s.stroke, borderWidth: s.strokeWidth, backgroundColor: s.bg }]} />
      <View style={[iconStyles.keepRoof, { borderBottomColor: s.stroke, borderBottomWidth: s.strokeWidth * 1.5 }]} />
      <View style={[iconStyles.keepDoor, { borderColor: s.stroke, borderWidth: s.strokeWidth }]} />
    </View>
  );
}

export function FloorTileIcon({ size = DEFAULT_SIZE, colour = '#800000', focused = false }: DungeonTileIconProps) {
  const s = getStyles(size, colour, focused);
  const dotSize = Math.max(2, s.size * 0.1);
  return (
    <View style={[iconStyles.container, { width: s.size, height: s.size }]} >
      {/* Floor tile with grid and corner studs */}
      <View style={[iconStyles.tileBase, { borderColor: s.stroke, borderWidth: s.strokeWidth, backgroundColor: s.bg }]} >
        <View style={[iconStyles.gridH, { backgroundColor: s.stroke, height: s.strokeWidth }]} />
        <View style={[iconStyles.gridV, { backgroundColor: s.stroke, width: s.strokeWidth }]} />
      </View>
      <View style={[iconStyles.stud, { width: dotSize, height: dotSize, backgroundColor: s.stroke, top: s.size * 0.18, left: s.size * 0.18 }]} />
      <View style={[iconStyles.stud, { width: dotSize, height: dotSize, backgroundColor: s.stroke, top: s.size * 0.18, right: s.size * 0.18 }]} />
      <View style={[iconStyles.stud, { width: dotSize, height: dotSize, backgroundColor: s.stroke, bottom: s.size * 0.18, left: s.size * 0.18 }]} />
      <View style={[iconStyles.stud, { width: dotSize, height: dotSize, backgroundColor: s.stroke, bottom: s.size * 0.18, right: s.size * 0.18 }]} />
    </View>
  );
}

export function ArchwayIcon({ size = DEFAULT_SIZE, colour = '#800000', focused = false }: DungeonTileIconProps) {
  const s = getStyles(size, colour, focused);
  return (
    <View style={[iconStyles.container, { width: s.size, height: s.size }]} >
      {/* Door archway */}
      <View style={[iconStyles.archFrame, { borderColor: s.stroke, borderWidth: s.strokeWidth, borderBottomWidth: 0, backgroundColor: s.bg }]} />
      <View style={[iconStyles.archDoor, { borderColor: s.stroke, borderWidth: s.strokeWidth }]} />
      <View style={[iconStyles.archBase, { backgroundColor: s.stroke, height: s.strokeWidth }]} />
    </View>
  );
}

export function ChestIcon({ size = DEFAULT_SIZE, colour = '#800000', focused = false }: DungeonTileIconProps) {
  const s = getStyles(size, colour, focused);
  return (
    <View style={[iconStyles.container, { width: s.size, height: s.size }]} >
      {/* Treasure chest */}
      <View style={[iconStyles.chestBody, { borderColor: s.stroke, borderWidth: s.strokeWidth, backgroundColor: s.bg }]} >
        <View style={[iconStyles.chestLid, { backgroundColor: s.stroke, height: s.strokeWidth }]} />
        <View style={[iconStyles.chestLock, { borderColor: s.stroke, borderWidth: s.strokeWidth }]} />
      </View>
    </View>
  );
}

export function TorchIcon({ size = DEFAULT_SIZE, colour = '#800000', focused = false }: DungeonTileIconProps) {
  const s = getStyles(size, colour, focused);
  return (
    <View style={[iconStyles.container, { width: s.size, height: s.size }]} >
      {/* Torch / Settings */}
      <View style={[iconStyles.torchFlameOuter, { borderColor: s.stroke, borderWidth: s.strokeWidth, backgroundColor: s.bg }]} />
      <View style={[iconStyles.torchFlameInner, { backgroundColor: s.stroke }]} />
      <View style={[iconStyles.torchStick, { backgroundColor: s.stroke, width: s.strokeWidth * 1.5 }]} />
      <View style={[iconStyles.torchBase, { backgroundColor: s.stroke, height: s.strokeWidth }]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },

  // Keep
  keepBody: {
    width: '55%',
    height: '50%',
    borderRadius: 2,
    position: 'absolute',
    bottom: '15%',
  },
  keepRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#800000',
    position: 'absolute',
    top: '15%',
  },
  keepDoor: {
    width: '22%',
    height: '28%',
    borderRadius: 10,
    borderBottomWidth: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    position: 'absolute',
    bottom: '15%',
  },

  // Floor tile
  tileBase: {
    width: '70%',
    height: '70%',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridH: {
    width: '100%',
    position: 'absolute',
  },
  gridV: {
    height: '100%',
    position: 'absolute',
  },
  stud: {
    borderRadius: 999,
    position: 'absolute',
  },

  // Archway
  archFrame: {
    width: '65%',
    height: '55%',
    borderRadius: 999,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: 'absolute',
    top: '15%',
  },
  archDoor: {
    width: '35%',
    height: '40%',
    borderRadius: 999,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    position: 'absolute',
    top: '30%',
  },
  archBase: {
    width: '75%',
    position: 'absolute',
    bottom: '20%',
  },

  // Chest
  chestBody: {
    width: '60%',
    height: '50%',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chestLid: {
    width: '100%',
    position: 'absolute',
    top: '35%',
  },
  chestLock: {
    width: '22%',
    height: '35%',
    borderRadius: 2,
    borderBottomWidth: 0,
    position: 'absolute',
    top: '20%',
  },

  // Torch
  torchFlameOuter: {
    width: '40%',
    height: '35%',
    borderRadius: 999,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    position: 'absolute',
    top: '12%',
  },
  torchFlameInner: {
    width: '20%',
    height: '18%',
    borderRadius: 999,
    position: 'absolute',
    top: '20%',
  },
  torchStick: {
    height: '40%',
    position: 'absolute',
    top: '42%',
  },
  torchBase: {
    width: '45%',
    position: 'absolute',
    bottom: '12%',
    borderRadius: 1,
  },
});
