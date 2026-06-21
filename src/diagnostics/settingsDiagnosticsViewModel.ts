import type { LocalDiagnosticLog } from './localDiagnostics';
import { buildLocalDiagnosticLog, writeLocalDiagnosticLogFile } from './localDiagnostics';

export interface DiagnosticsShareOptions {
  mimeType?: string;
  dialogTitle?: string;
  UTI?: string;
}

export interface DiagnosticsShareServices {
  writeLogFile?: (log: LocalDiagnosticLog) => Promise<{ uri: string; fileName: string }>;
  shareAsync?: (uri: string, options?: DiagnosticsShareOptions) => Promise<void>;
}

export type DiagnosticsShareResult =
  | { success: true; uri: string; fileName: string }
  | { success: false; error: string };

const DEFAULT_SHARE_OPTIONS: DiagnosticsShareOptions = {
  mimeType: 'application/json',
  dialogTitle: 'Share TileKeeper diagnostics',
  UTI: 'public.json',
};

export async function exportAndShareDiagnostics(
  log = buildLocalDiagnosticLog(),
  services: DiagnosticsShareServices = {},
): Promise<DiagnosticsShareResult> {
  try {
    const writeLogFile = services.writeLogFile ?? writeLocalDiagnosticLogFile;
    const shareAsync = services.shareAsync ?? defaultShareAsync;
    const written = await writeLogFile(log);
    await shareAsync(written.uri, DEFAULT_SHARE_OPTIONS);
    return { success: true, uri: written.uri, fileName: written.fileName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not export diagnostics.' };
  }
}

async function defaultShareAsync(uri: string, options?: DiagnosticsShareOptions): Promise<void> {
  const Sharing = await import('expo-sharing');
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Native sharing is unavailable on this platform.');
  }
  await Sharing.shareAsync(uri, options);
}
