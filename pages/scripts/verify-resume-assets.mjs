import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pagesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(pagesDir, '..');
const manifestPath = resolve(repoDir, 'assets/data/terminal/filesystem.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const metadata = manifest.resumePdf;

function fail(message) {
  throw new Error(`Resume asset verification failed: ${message}`);
}

if (!metadata?.filename || !metadata?.source) {
  fail('filesystem.json must define resumePdf.filename and resumePdf.source');
}

const pdfPath = resolve(repoDir, 'assets/resume', metadata.filename);
const sourcePath = resolve(repoDir, 'assets/resume', metadata.source);
const pdf = readFileSync(pdfPath);
const source = readFileSync(sourcePath);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const normalizedSource = source.toString('utf8').replace(/\r\n/g, '\n');

if (!pdf.subarray(0, 8).toString('ascii').startsWith(`%PDF-${metadata.version}`)) {
  fail(`${metadata.filename} is not the declared PDF ${metadata.version} artifact`);
}
if (pdf.byteLength !== metadata.bytes) {
  fail(`${metadata.filename} is ${pdf.byteLength} bytes; expected ${metadata.bytes}`);
}
if (sha256(pdf) !== metadata.sha256) {
  fail(`${metadata.filename} checksum does not match filesystem.json`);
}
if (sha256(normalizedSource) !== metadata.sourceSha256) {
  fail(`${metadata.source} changed; regenerate the PDF and update resumePdf metadata`);
}

console.log(`Verified ${metadata.filename} (${metadata.bytes} bytes, PDF ${metadata.version}, ${metadata.pages} pages).`);
