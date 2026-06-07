import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GridCell, Layout, LayoutPlacement, TileType } from '../shared/types';
import {
  buildLayoutPreviewScreenModel,
  inspectTileAtGridCell,
  panLayoutPreview,
  selectTileByPlacementIndex,
  zoomLayoutPreview,
  type LayoutPreviewTileInspection,
  type LayoutPreviewViewport,
} from './layoutPreviewScreenModel';

export interface LayoutPreviewScreenProps {
  layout: Layout;
  catalog: TileType[];
}

const VIEWPORT = { width: 340, height: 360 };
const CONTROL_PAN_STEP = 48;

export function LayoutPreviewScreen({ layout, catalog }: LayoutPreviewScreenProps) {
  const [viewport, setViewport] = useState<LayoutPreviewViewport>({
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    pan: { x: 0, y: 0 },
    zoom: 1,
  });
  const [selectedPlacementIndex, setSelectedPlacementIndex] = useState<number | null>(null);

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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TileKeeper</Text>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.subtitle}>
          {model.layoutSummary.goal} · {model.layoutSummary.placementCount} tiles
        </Text>
      </View>

      <View style={styles.previewFrame}>
        <View style={styles.viewport}>
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
                <Text style={[styles.tileLabel, { left: tile.labelAnchor.x - 46, top: tile.labelAnchor.y - 9 }]}>
                  {tile.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: -CONTROL_PAN_STEP, y: 0 }))}>
            <Text style={styles.controlText}>←</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: 0, y: -CONTROL_PAN_STEP }))}>
            <Text style={styles.controlText}>↑</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: 0, y: CONTROL_PAN_STEP }))}>
            <Text style={styles.controlText}>↓</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setViewport((value) => panLayoutPreview(value, { x: CONTROL_PAN_STEP, y: 0 }))}>
            <Text style={styles.controlText}>→</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setViewport((value) => zoomLayoutPreview(value, 1.2))}>
            <Text style={styles.controlText}>＋</Text>
          </Pressable>
          <Pressable style={styles.controlButton} onPress={() => setViewport((value) => zoomLayoutPreview(value, 0.8))}>
            <Text style={styles.controlText}>－</Text>
          </Pressable>
        </View>
      </View>

      <TileInspectionPanel tile={selectedTile} />
    </View>
  );
}

function TileInspectionPanel({ tile }: { tile: LayoutPreviewTileInspection | null }) {
  if (!tile) {
    return (
      <View style={styles.inspectionPanel}>
        <Text style={styles.panelTitle}>Tile inspection</Text>
        <Text style={styles.panelBody}>Tap any tile in the schematic grid to inspect face, sockets, rotation, and occupied cells.</Text>
      </View>
    );
  }

  return (
    <View style={styles.inspectionPanel}>
      <Text style={styles.panelTitle}>{tile.tileName}</Text>
      <Text style={styles.panelBody}>
        {tile.faceName} · {tile.category} · rotation {tile.rotation}°
      </Text>
      <Text style={styles.panelBody}>Set: {tile.productSet}</Text>
      <Text style={styles.panelBody}>Cells: {tile.occupiedCells.map((cell) => `(${cell.x},${cell.y})`).join(', ')}</Text>
      <Text style={styles.panelBody}>Sockets: {tile.sockets.map((socket) => `${socket.face}:${socket.socketType}`).join(', ')}</Text>
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
  tileCellSelected: {
    borderColor: '#fbbf24',
    borderWidth: 4,
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
