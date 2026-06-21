#!/usr/bin/env tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildCatalogPublication, type CatalogPublicationInput } from '../src/catalog/catalogPackBuilder';

interface CliArgs {
  inputPath: string;
  outputDir: string;
}

function parseArgs(argv: string[]): CliArgs {
  const inputFlag = argv.indexOf('--input');
  const outputFlag = argv.indexOf('--output-dir');

  if (inputFlag === -1 || !argv[inputFlag + 1] || outputFlag === -1 || !argv[outputFlag + 1]) {
    throw new Error('Usage: npx tsx scripts/build-catalog-pack.ts --input catalog-pack.json --output-dir dist/catalog');
  }

  return { inputPath: argv[inputFlag + 1], outputDir: argv[outputFlag + 1] };
}

async function main(): Promise<void> {
  const { inputPath, outputDir } = parseArgs(process.argv.slice(2));
  const input = JSON.parse(await readFile(inputPath, 'utf8')) as CatalogPublicationInput;
  const publication = await buildCatalogPublication({
    ...input,
    hmacSecret: input.hmacSecret ?? process.env.CATALOG_HMAC_SECRET,
  });

  for (const [relativePath, envelope] of Object.entries(publication.files)) {
    const outputPath = path.join(outputDir, relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  }

  console.log(`Catalog publication written to ${outputDir}`);
  console.log(`Manifest: ${path.join(outputDir, publication.manifestPath)}`);
  console.log(`Packs: ${publication.packEnvelopes.map((pack) => `${pack.payload.id}@${pack.payload.version}`).join(', ')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
