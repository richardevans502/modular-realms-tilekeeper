export interface ExportShareOptions {
  mimeType: string;
  dialogTitle: string;
  UTI?: string;
}

export interface WrittenExportFile {
  uri: string;
  fileName: string;
}

export interface ShareExportServices {
  writeTextFile?: (fileName: string, content: string) => Promise<WrittenExportFile>;
  writeDataUrlFile?: (fileName: string, dataUrl: string) => Promise<WrittenExportFile>;
  printToFileAsync?: (html: string) => Promise<{ uri: string }>;
  movePrintedPdf?: (fileName: string, printedUri: string) => Promise<WrittenExportFile>;
  shareAsync?: (uri: string, options: ExportShareOptions) => Promise<void>;
}

export type ExportShareResult =
  | { success: true; uri: string; fileName: string }
  | { success: false; error: string };

export async function shareJsonExport(
  fileName: string,
  json: string,
  services: ShareExportServices = {},
): Promise<ExportShareResult> {
  return writeAndShare(
    () => (services.writeTextFile ?? writeTextExportFile)(fileName, json),
    {
      mimeType: 'application/json',
      dialogTitle: 'Share TileKeeper JSON export',
      UTI: 'public.json',
    },
    services,
  );
}

export async function sharePngExport(
  fileName: string,
  dataUrl: string,
  services: ShareExportServices = {},
): Promise<ExportShareResult> {
  return writeAndShare(
    () => (services.writeDataUrlFile ?? writeDataUrlExportFile)(fileName, dataUrl),
    {
      mimeType: 'image/png',
      dialogTitle: 'Share TileKeeper PNG schematic',
      UTI: 'public.png',
    },
    services,
  );
}

export async function sharePdfExport(
  fileName: string,
  html: string,
  services: ShareExportServices = {},
): Promise<ExportShareResult> {
  try {
    const printToFileAsync = services.printToFileAsync ?? defaultPrintToFileAsync;
    const printed = await printToFileAsync(html);
    const movePrintedPdf = services.movePrintedPdf ?? renamePrintedPdf;
    const written = await movePrintedPdf(fileName, printed.uri);
    const shareAsync = services.shareAsync ?? defaultShareAsync;
    await shareAsync(written.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share TileKeeper PDF prep sheet',
      UTI: 'com.adobe.pdf',
    });
    return { success: true, uri: written.uri, fileName: written.fileName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not create PDF export.' };
  }
}

async function writeAndShare(
  writeFile: () => Promise<WrittenExportFile>,
  options: ExportShareOptions,
  services: ShareExportServices,
): Promise<ExportShareResult> {
  try {
    const written = await writeFile();
    const shareAsync = services.shareAsync ?? defaultShareAsync;
    await shareAsync(written.uri, options);
    return { success: true, uri: written.uri, fileName: written.fileName };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not share export.' };
  }
}

export async function writeTextExportFile(fileName: string, content: string): Promise<WrittenExportFile> {
  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, fileName);
  if (file.exists) file.delete();
  file.create({ overwrite: true });
  file.write(content);
  return { uri: file.uri, fileName };
}

export async function writeDataUrlExportFile(fileName: string, dataUrl: string): Promise<WrittenExportFile> {
  const commaIndex = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || commaIndex === -1) {
    throw new Error('Invalid PNG data URL.');
  }
  const base64 = dataUrl.slice(commaIndex + 1);
  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, fileName);
  if (file.exists) file.delete();
  file.create({ overwrite: true });
  file.write(base64ToBytes(base64));
  return { uri: file.uri, fileName };
}

async function renamePrintedPdf(fileName: string, printedUri: string): Promise<WrittenExportFile> {
  const { File, Paths } = await import('expo-file-system');
  const source = new File(printedUri);
  const target = new File(Paths.document, fileName);
  if (target.exists) target.delete();
  source.move(target);
  return { uri: target.uri, fileName };
}

async function defaultShareAsync(uri: string, options: ExportShareOptions): Promise<void> {
  const Sharing = await import('expo-sharing');
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Native sharing is unavailable on this platform.');
  }
  await Sharing.shareAsync(uri, options);
}

async function defaultPrintToFileAsync(html: string): Promise<{ uri: string }> {
  const Print = await import('expo-print');
  return Print.printToFileAsync({ html, base64: false });
}

function base64ToBytes(base64: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/\s/g, '');
  const output: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = alphabet.indexOf(clean[i]);
    const c2 = alphabet.indexOf(clean[i + 1]);
    const c3 = clean[i + 2] === '=' ? -1 : alphabet.indexOf(clean[i + 2]);
    const c4 = clean[i + 3] === '=' ? -1 : alphabet.indexOf(clean[i + 3]);
    if (c1 < 0 || c2 < 0 || (clean[i + 2] !== '=' && c3 < 0) || (clean[i + 3] !== '=' && c4 < 0)) {
      throw new Error('Invalid base64 data.');
    }
    output.push((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) output.push(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 >= 0 && c3 >= 0) output.push(((c3 & 3) << 6) | c4);
  }
  return new Uint8Array(output);
}
