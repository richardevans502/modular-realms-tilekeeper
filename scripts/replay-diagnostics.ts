#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { replayDiagnosticsExport } from '../src/diagnostics/diagnosticsReplay';
import type { LocalDiagnosticLog } from '../src/diagnostics/localDiagnostics';

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npm run diagnostics:replay -- <tilekeeper-diagnostics.json>');
    process.exit(2);
  }

  const log = JSON.parse(readFileSync(filePath, 'utf8')) as LocalDiagnosticLog;
  const replay = replayDiagnosticsExport(log);

  if (!replay.ok) {
    console.error(`Replay failed: ${replay.reason}`);
    process.exit(1);
  }

  const result = replay.result;
  const summary = {
    ok: true,
    generatedAt: replay.generatedAt,
    solverVersion: replay.solverVersion,
    catalogVersion: replay.catalogVersion,
    solverResult: result.ok
      ? {
          ok: true,
          layouts: result.layouts.length,
          topLayoutPlacements: result.layouts[0]?.layout.placements.length ?? 0,
          exploredStates: result.trace.exploredStates,
          timeoutHit: result.trace.timeoutHit,
          cancelled: result.trace.cancelled,
        }
      : {
          ok: false,
          reason: result.reason,
          exploredStates: result.trace.exploredStates,
        },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main();
