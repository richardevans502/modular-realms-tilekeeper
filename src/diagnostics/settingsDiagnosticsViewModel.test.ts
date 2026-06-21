import { diagnosticsConsentCopy } from './localDiagnostics';
import { exportAndShareDiagnostics, type DiagnosticsShareServices } from './settingsDiagnosticsViewModel';

describe('settings diagnostics export/share flow', () => {
  const log = {
    schemaVersion: 1 as const,
    generatedAt: '2026-06-12T12:34:56.789Z',
    collectionMode: 'local-only-opt-in' as const,
    consent: {
      required: true as const,
      explanation: 'Generated only when requested.',
      collected: ['app version', 'solver timing'],
      excluded: ['inventory data', 'layout data', 'device identifiers'],
    },
    app: { name: 'TileKeeper', version: '0.1.0' },
    catalog: { version: 'legacy' },
    solver: { version: 'solver-test', runs: [] },
    navigation: { events: [] },
    errors: [],
  };

  test('writes diagnostics JSON then opens the native share sheet', async () => {
    const calls: string[] = [];
    const services: DiagnosticsShareServices = {
      writeLogFile: async (diagnosticLog) => {
        calls.push(`write:${diagnosticLog.generatedAt}`);
        return { uri: 'file:///documents/tilekeeper-diagnostics.json', fileName: 'tilekeeper-diagnostics.json' };
      },
      shareAsync: async (uri, options) => {
        calls.push(`share:${uri}:${options?.mimeType}:${options?.dialogTitle}`);
      },
    };

    await expect(exportAndShareDiagnostics(log, services)).resolves.toEqual({
      success: true,
      uri: 'file:///documents/tilekeeper-diagnostics.json',
      fileName: 'tilekeeper-diagnostics.json',
    });
    expect(calls).toEqual([
      'write:2026-06-12T12:34:56.789Z',
      'share:file:///documents/tilekeeper-diagnostics.json:application/json:Share TileKeeper diagnostics',
    ]);
  });

  test('reports unavailable sharing without leaking the generated file path as a success', async () => {
    const services: DiagnosticsShareServices = {
      writeLogFile: async () => ({ uri: 'file:///documents/tilekeeper-diagnostics.json', fileName: 'tilekeeper-diagnostics.json' }),
      shareAsync: async () => {
        throw new Error('Native sharing is unavailable on this platform.');
      },
    };

    await expect(exportAndShareDiagnostics(log, services)).resolves.toEqual({
      success: false,
      error: 'Native sharing is unavailable on this platform.',
    });
  });

  test('explains opt-in collection and explicit exclusions in consent copy', () => {
    const copy = diagnosticsConsentCopy();
    expect(copy).toContain('opt-in');
    expect(copy).toContain('only when you tap Export diagnostics');
    expect(copy).toContain('inventory');
    expect(copy).toContain('layouts');
    expect(copy).toContain('device identifiers');
  });
});
