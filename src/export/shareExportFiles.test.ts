import { shareJsonExport, sharePdfExport, sharePngExport, type ShareExportServices } from './shareExportFiles';

describe('shareExportFiles', () => {
  test('writes JSON then opens the native share sheet', async () => {
    const calls: string[] = [];
    const services: ShareExportServices = {
      writeTextFile: async (fileName, content) => {
        calls.push(`write:${fileName}:${content}`);
        return { uri: `file:///documents/${fileName}`, fileName };
      },
      shareAsync: async (uri, options) => {
        calls.push(`share:${uri}:${options.mimeType}:${options.dialogTitle}`);
      },
    };

    await expect(shareJsonExport('layout.json', '{"ok":true}', services)).resolves.toEqual({
      success: true,
      uri: 'file:///documents/layout.json',
      fileName: 'layout.json',
    });
    expect(calls).toEqual([
      'write:layout.json:{"ok":true}',
      'share:file:///documents/layout.json:application/json:Share TileKeeper JSON export',
    ]);
  });

  test('writes PNG data URL bytes then opens the native share sheet', async () => {
    const calls: string[] = [];
    const services: ShareExportServices = {
      writeDataUrlFile: async (fileName, dataUrl) => {
        calls.push(`write:${fileName}:${dataUrl.slice(0, 22)}`);
        return { uri: `file:///documents/${fileName}`, fileName };
      },
      shareAsync: async (uri, options) => {
        calls.push(`share:${uri}:${options.mimeType}:${options.UTI}`);
      },
    };

    await expect(sharePngExport('layout.png', 'data:image/png;base64,iVBORw0KGgo=', services)).resolves.toEqual({
      success: true,
      uri: 'file:///documents/layout.png',
      fileName: 'layout.png',
    });
    expect(calls).toEqual([
      'write:layout.png:data:image/png;base64,',
      'share:file:///documents/layout.png:image/png:public.png',
    ]);
  });

  test('prints PDF HTML then shares the PDF', async () => {
    const calls: string[] = [];
    const services: ShareExportServices = {
      printToFileAsync: async (html) => {
        calls.push(`print:${html}`);
        return { uri: 'file:///cache/generated.pdf' };
      },
      movePrintedPdf: async (fileName, printedUri) => {
        calls.push(`move:${printedUri}:${fileName}`);
        return { uri: `file:///documents/${fileName}`, fileName };
      },
      shareAsync: async (uri, options) => {
        calls.push(`share:${uri}:${options.mimeType}:${options.dialogTitle}`);
      },
    };

    await expect(sharePdfExport('prep.pdf', '<html>prep</html>', services)).resolves.toEqual({
      success: true,
      uri: 'file:///documents/prep.pdf',
      fileName: 'prep.pdf',
    });
    expect(calls).toEqual([
      'print:<html>prep</html>',
      'move:file:///cache/generated.pdf:prep.pdf',
      'share:file:///documents/prep.pdf:application/pdf:Share TileKeeper PDF prep sheet',
    ]);
  });

  test('reports unavailable sharing as a failed export', async () => {
    const services: ShareExportServices = {
      writeTextFile: async () => ({ uri: 'file:///documents/layout.json', fileName: 'layout.json' }),
      shareAsync: async () => {
        throw new Error('Native sharing is unavailable on this platform.');
      },
    };

    await expect(shareJsonExport('layout.json', '{}', services)).resolves.toEqual({
      success: false,
      error: 'Native sharing is unavailable on this platform.',
    });
  });
});
