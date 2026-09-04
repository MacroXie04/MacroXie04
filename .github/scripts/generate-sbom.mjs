import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputArgument = process.argv[2];

if (!outputArgument) {
  throw new Error('Usage: node generate-sbom.mjs <output-path>');
}

const outputPath = resolve(outputArgument);
const rawSbom = execFileSync(
  'npm',
  ['sbom', '--sbom-format=cyclonedx'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  },
);
const sbom = JSON.parse(rawSbom);

if (sbom.bomFormat !== 'CycloneDX') {
  throw new Error(`Unexpected SBOM format: ${String(sbom.bomFormat)}`);
}
if (!Array.isArray(sbom.components) || sbom.components.length === 0) {
  throw new Error('Generated SBOM does not contain any components');
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
console.log(`Wrote CycloneDX SBOM with ${sbom.components.length} components to ${outputPath}`);
