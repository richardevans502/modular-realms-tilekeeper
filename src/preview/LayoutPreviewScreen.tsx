import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GridCell, Layout, LayoutPlacement, Rotation, TileType } from '../shared/types';
import {
  buildLayoutPreviewScreenModel,
  inspectTileAtGridCell,
  panLayoutPreview,
  selectTileByPlacementIndex,
  zoomLayoutPreview,
  type LayoutPreviewTileInspection,
  type LayoutPreviewViewport,
} from './layoutPreviewScreenModel';
import { SaveLayoutModal, type SaveLayoutFormData } from './SaveLayoutModal';
import type { SchematicPreviewSocketSegment } from './schematicPreview';

export interface LayoutPreviewScreenProps {
  layout: Layout;
  catalog: TileType[];
  onBackToLayoutGoal?: () => void;
  onSaveLayout?: (data: SaveLayoutFormData) => Promise<void> | void;
}

const VIEWPORT = { width: 340, height: 360 };
const CONTROL_PAN_STEP = 48;

export function LayoutPreviewScreen({ layout, catalog, onBackToLayoutGoal, onSaveLayout }: LayoutPreviewScreenProps) {
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState<LayoutPreviewViewport>({
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    pan: { x: 0, y: 0 },
    zoom: 1,
  });
  const [selectedPlacementIndex, setSelectedPlacementIndex] = useState<number | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const gestureRef = useRef<{ lastPan: { x: number; y: number }; lastDistance: number | null }>({
    lastPan: { x: 0, y: 0 },
    lastDistance: null,
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          gestureRef.current.lastPan = { x: 0, y: 0 };
          gestureRef.current.lastDistance = touchDistance(event);
        },
        onPanResponderMove: (event, gestureState) => {
          const distance = touchDistance(event);
          if (distance && gestureRef.current.lastDistance) {
            setViewport((value) => zoomLayoutPreview(value, distance / gestureRef.current.lastDistance!));
            gestureRef.current.lastDistance = distance;
            return;
          }

          gestureRef.current.lastDistance = null;
          panFromGesture(gestureState);
        },
        onPanResponderRelease: resetGesture,
        onPanResponderTerminate: resetGesture,
      }),
    [],
  );

  function panFromGesture(gestureState: PanResponderGestureState) {
    const delta = {
      x: gestureState.dx - gestureRef.current.lastPan.x,
      y: gestureState.dy - gestureRef.current.lastPan.y,
    };
    gestureRef.current.lastPan = { x: gestureState.dx, y: gestureState.dy };
    setViewport((value) => panLayoutPreview(value, delta));
  }

  function resetGesture() {
    gestureRef.current.lastPan = { x: 0, y: 0 };
    gestureRef.current.lastDistance = null;
  }

  const model = useMemo(
    () =>
      buildLayoutPreviewScreenModel(layout, catalog, {
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        pan: viewport.pan,
        zoom: viewport.zoom,
        selectedPlacementIndex,
        cellSize: 54,
        padding: 14,
        showGrid: true,
      }),
    [catalog, layout, selectedPlacementIndex, viewport],
  );

  const selectedTile = model.selectedTile;

  function selectCell(grid: GridCell) {
    const hit = inspectTileAtGridCell(layout, catalog, grid, {
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      pan: viewport.pan,
      zoom: viewport.zoom,
      cellSize: 54,
      padding: 14,
      showGrid: true,
    });
    setSelectedPlacementIndex(hit?.selectedTile?.placementIndex ?? null);
  }

  function selectPlacement(index: number) {
    setSelectedPlacementIndex(selectTileByPlacementIndex(layout, catalog, index)?.selectedTile?.placementIndex ?? null);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>TileKeeper</Text>
            <Text style={styles.title}>{model.title}</Text>
          </View>
          <View style={styles.headerActions}>
            {onSaveLayout && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save layout to library"
                onPress={() => setSaveModalOpen(true)}
                style={[styles.backButton, styles.saveButton]}
              >
                <Text style={styles.backButtonText}>Save</Text>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="Back to Layout Goal" style={styles.backButton} onPress={onBackToLayoutGoal}>
              <Text style={styles.backButtonText}>← Goal</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {model.layoutSummary.goal} · {model.layoutSummary.placementCount} tiles · zoom {model.viewport.zoom.toFixed(1)}×
        </Text>
        {saveStatus === 'saved' && <Text style={styles.saveStatusText}>✓ Saved to library</Text>}
        {saveStatus === 'error' && <Text style={styles.saveErrorText}>Could not save layout.</Text>}
      </View>

      <View style={styles.previewFrame}>
        <View style={styles.viewport} {...panResponder.panHandlers}>
          <View
            style={[
              styles.schematicLayer,
              {
                width: model.schematic.width + model.schematic.padding * 2,
                height: model.schematic.height + model.schematic.padding * 2,
                transform: [
                  { translateX: model.contentTransform.translateX },
                  { translateY: model.contentTransform.translateY },
                  { scale: model.contentTransform.scale },
                ],
              },
            ]}
          >
            {model.schematic.gridCells.map((cell) => (
              <Pressable
                key={cell.key}
                accessibilityRole="button"
                accessibilityLabel={`Inspect grid ${cell.grid.x}, ${cell.grid.y}`}
                onPress={() => selectCell(cell.grid)}
                style={[styles.gridCell, { left: cell.x, top: cell.y, width: model.schematic.cellSize, height: model.schematic.cellSize }]}
              />
            ))}
            {model.schematic.tiles.map((tile) => (
              <View key={tile.key}>
                {tile.cells.map((cell) => (
                  <Pressable
                    key={`${tile.key}:${cell.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Inspect ${tile.label}`}
                    onPress={() => selectPlacement(tile.placementIndex)}
                    style={[
                      styles.tileCell,
                      tile.simplified ? styles.tileCellSimplified : null,
                      selectedPlacementIndex === tile.placementIndex ? styles.tileCellSelected : null,
                      {
                        backgroundColor: tile.color,
                        left: cell.x,
                        top: cell.y,
                        width: model.schematic.cellSize,
                        height: model.schematic.cellSize,
                      },
                    ]}
                  />
                ))}
                {!tile.simplified && tile.sockets.map((socket) => (
                  <View
                    key={`${tile.key}:${socket.face}:${socket.socketType}`}
                    accessibilityLabel={`${socket.compatibility} ${socket.socketType} socket on ${socket.face}`}
                    style={[
                      styles.socketIndicator,
                      socket.compatibility === 'compatible' ? styles.socketCompatible : styles.socketIncompatible,
                      socketIndicatorStyle(socket),
                    ]}
                  />
                ))}
                {!tile.simplified && (
                  <Text style={[styles.rotationMarker, { left: tile.labelAnchor.x - 8, top: tile.labelAnchor.y + 12 }]}>
                    {rotationArrow(tile.rotation)}
                  </Text>
                )}
                {!tile.simplified && (
                  <Text style={[styles.tileLabel, { left: tile.labelAnchor.x - 46, top: tile.labelAnchor.y - 9 }]}>
                    {tile.label}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Pan left" style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: -CONTROL_PAN_STEP, y: 0 }))}>
            <Text style={styles.controlText}>←</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Pan up" style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: 0, y: -CONTROL_PAN_STEP }))}>
            <Text style={styles.controlText}>↑</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Pan down" style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: 0, y: CONTROL_PAN_STEP }))}>
            <Text style={styles.controlText}>↓</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Pan right" style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: CONTROL_PAN_STEP, y: 0 }))}>
            <Text style={styles.controlText}>→</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" style={styles.controlButton} onPress={() => setViewport((value) => zoomLayoutPreview(value, 1.2))}>
            <Text style={styles.controlText}>＋</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" style={styles.controlButton} onPress={() => setViewport((value) => zoomLayoutPreview(value, 0.8))}>
            <Text style={styles.controlText}>－</Text>
          </Pressable>
        </View>

        <View style={styles.legend}>
          {model.legend.map((item) => (
            <View key={item.category} style={styles.legendItem} accessibilityLabel={`${item.label} legend`}>
              <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} allowFontScaling>{item.label}</Text>
            </View>
          ))}
          <View style={styles.legendItem} accessibilityLabel="Compatible socket legend">
            <View style={[styles.socketLegendLine, styles.socketCompatible]} />
            <Text style={styles.legendText} allowFontScaling>Compatible socket</Text>
          </View>
          <View style={styles.legendItem} accessibilityLabel="Mismatch or open socket legend">
            <View style={[styles.socketLegendLine, styles.socketIncompatible]} />
            <Text style={styles.legendText} allowFontScaling>Mismatch / open socket</Text>
          </View>
          {model.schematic.deferredTileCount > 0 && (
            <Text style={styles.legendText}>{model.schematic.deferredTileCount} off-screen tiles deferred for smooth pan/zoom</Text>
          )}
        </View>
      </View>

      <TileInspectionPanel tile={selectedTile} />

      <SaveLayoutModal
        visible={saveModalOpen}
        initialName={layout.goal}
        onCancel={() => setSaveModalOpen(false)}
        onSave={async (data) => {
          setSaveModalOpen(false);
          setSaveStatus('saving');
          try {
            await onSaveLayout?.(data);
            setSaveStatus('saved');
          } catch {
            setSaveStatus('error');
          }
        }}
      />
    </View>
  );
}

function touchDistance(event: GestureResponderEvent): number | null {
  const [first, second] = event.nativeEvent.touches;
  if (!first || !second) {
    return null;
  }
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

function rotationArrow(rotation: Rotation): string {
  switch (rotation) {
    case 0:
      return '↑';
    case 90:
      return '→';
    case 180:
      return '↓';
    case 270:
      return '←';
  }
}

function socketIndicatorStyle(socket: SchematicPreviewSocketSegment) {
  const horizontal = socket.face === 'north' || socket.face === 'south';
  return {
    left: socket.x1,
    top: socket.y1,
    width: horizontal ? Math.max(8, Math.abs(socket.x2 - socket.x1)) : 5,
    height: horizontal ? 5 : Math.max(8, Math.abs(socket.y2 - socket.y1)),
  };
}

function TileInspectionPanel({ tile }: { tile: LayoutPreviewTileInspection | null }) {
  if (!tile) {
    return (
      <View style={styles.inspectionPanel}>
        <Text style={styles.panelTitle} allowFontScaling>Tile inspection</Text>
        <Text style={styles.panelBody} allowFontScaling>Tap any tile in the schematic grid to inspect face, sockets, rotation, and occupied cells.</Text>
      </View>
    );
  }

  return (
    <View style={styles.inspectionPanel}>
      <Text style={styles.panelTitle} allowFontScaling>{tile.tileName}</Text>
      <Text style={styles.panelBody} allowFontScaling>
        {tile.faceName} · {tile.category} · rotation {tile.rotation}°
      </Text>
      <Text style={styles.panelBody} allowFontScaling>tile_type_id: {tile.tileTypeId}</Text>
      <Text style={styles.panelBody} allowFontScaling>face_id: {tile.faceId}</Text>
      <Text style={styles.panelBody} allowFontScaling>Set: {tile.productSet}</Text>
      <Text style={styles.panelBody} allowFontScaling>Cells: {tile.occupiedCells.map((cell) => `(${cell.x},${cell.y})`).join(', ')}</Text>
      <Text style={styles.panelBody} allowFontScaling>Sockets: {tile.sockets.map((socket) => `${socket.face}:${socket.socketType}`).join(', ')}</Text>
    </View>
  );
}

export function buildDemoLayout(catalog: TileType[]): Layout {
  const demoTiles = catalog.slice(0, 6);
  const placements: LayoutPlacement[] = demoTiles.map((tile, index) => {
    const grid: GridCell = { x: index % 3, y: Math.floor(index / 3) };
    return {
      tile_type_id: tile.id,
      face_id: tile.faces[0]?.face_id ?? 'front',
      x: grid.x,
      y: grid.y,
      rotation: index % 2 === 0 ? 0 : 90,
      grid_cells: tile.dimensions.grid_cells.map((cell) => ({ x: grid.x + cell.x, y: grid.y + cell.y })),
    };
  });

  return {
    id: 'demo-layout-preview',
    placements,
    seed: 'demo-preview',
    goal: 'Review a generated room sketch before export',
    solver_version: 'layout-preview-screen-demo',
    catalog_version: demoTiles[0]?.catalog_version ?? 'demo',
    created_at: '2026-06-07T00:00:00.000Z',
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 18,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  saveStatusText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  saveErrorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  backButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
  },
  previewFrame: {
    backgroundColor: '#111827',
    borderColor: '#fbbf24',
    borderRadius: 24,
    borderWidth: 2,
    padding: 12,
    gap: 12,
  },
  viewport: {
    height: VIEWPORT.height,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#020617',
  },
  schematicLayer: {
    position: 'relative',
  },
  gridCell: {
    position: 'absolute',
    borderColor: '#334155',
    borderWidth: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  tileCell: {
    position: 'absolute',
    borderColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 2,
  },
  tileCellSimplified: {
    opacity: 0.72,
  },
  tileCellSelected: {
    borderColor: '#fbbf24',
    borderWidth: 4,
  },
  socketIndicator: {
    position: 'absolute',
    borderColor: '#020617',
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.9,
  },
  socketCompatible: {
    backgroundColor: '#22c55e',
  },
  socketIncompatible: {
    backgroundColor: '#ef4444',
  },
  rotationMarker: {
    position: 'absolute',
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  tileLabel: {
    position: 'absolute',
    width: 92,
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    minWidth: 46,
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  controlText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendSwatch: {
    borderColor: '#020617',
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  legendText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  socketLegendLine: {
    borderRadius: 999,
    height: 5,
    width: 24,
  },
  inspectionPanel: {
    borderColor: '#334155',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    gap: 6,
  },
  panelTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '800',
  },
  panelBody: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
});
