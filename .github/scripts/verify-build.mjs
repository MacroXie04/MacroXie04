import { createHash } from 'node:crypto';
import {
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const buildDir = resolve(process.argv[2] || 'build');
const metadataFilename = 'deploy-meta.json';
const checksumsFilename = 'SHA256SUMS';

function fail(message) {
  throw new Error(`Build verification failed: ${message}`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requireNonemptyFile(relativePath) {
  const absolutePath = resolve(buildDir, relativePath);
  const buildPrefix = `${buildDir}${sep}`;
  if (!absolutePath.startsWith(buildPrefix)) {
    fail(`path escapes build directory: ${relativePath}`);
  }
  if (!lstatSync(absolutePath, { throwIfNoEntry: false })?.isFile()) {
    fail(`missing required file: ${relativePath}`);
  }
  if (statSync(absolutePath).size === 0) {
    fail(`required file is empty: ${relativePath}`);
  }
  return absolutePath;
}

function listFiles(directory, excluded = new Set()) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    const relativePath = relative(buildDir, absolutePath).split(sep).join('/');
    if (entry.isSymbolicLink()) {
      fail(`artifact contains a symbolic link: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      files.push(...listFiles(absolutePath, excluded));
    } else if (entry.isFile() && !excluded.has(relativePath)) {
      if (relativePath.includes('\n') || relativePath.includes('\r')) {
        fail(`artifact filename contains a newline: ${JSON.stringify(relativePath)}`);
      }
      files.push(relativePath);
    }
  }
  return files.sort();
}

function fileEntries(relativePaths) {
  return relativePaths.map(relativePath => {
    const contents = readFileSync(resolve(buildDir, relativePath));
    return {
      path: relativePath,
      bytes: contents.byteLength,
      sha256: sha256(contents),
    };
  });
}

const indexPath = requireNonemptyFile('index.html');
requireNonemptyFile('manifest.json');
requireNonemptyFile('robots.txt');
requireNonemptyFile('sitemap.xml');

const filesystemManifestPath = requireNonemptyFile('data/terminal/filesystem.json');
const filesystemManifest = JSON.parse(readFileSync(filesystemManifestPath, 'utf8'));
const resumeFilename = filesystemManifest.resumePdf?.filename;
if (!resumeFilename || resumeFilename.includes('/') || resumeFilename.includes('\\')) {
  fail('resume filename is missing or unsafe in data/terminal/filesystem.json');
}
requireNonemptyFile(`resume/${resumeFilename}`);

const indexHtml = readFileSync(indexPath, 'utf8');
if (/\/(?:src)\//.test(indexHtml)) {
  fail('built index.html still references source files');
}

const references = [...indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map(match => match[1]);
const localReferences = references.filter(reference =>
  !/^(?:[a-z]+:|\/\/|#)/i.test(reference),
);

let javascriptAssets = 0;
let stylesheetAssets = 0;
for (const reference of localReferences) {
  const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const relativePath = cleanReference.replace(/^\/+/, '');
  requireNonemptyFile(relativePath);
  if (/\.js$/i.test(relativePath)) javascriptAssets += 1;
  if (/\.css$/i.test(relativePath)) stylesheetAssets += 1;
}
if (javascriptAssets === 0 || stylesheetAssets === 0) {
  fail('index.html must reference at least one JavaScript and one stylesheet asset');
}

const contentFiles = listFiles(
  buildDir,
  new Set([metadataFilename, checksumsFilename]),
);
const contentEntries = fileEntries(contentFiles);
const totalBytes = contentEntries.reduce((sum, file) => sum + file.bytes, 0);
const contentSha256 = sha256(
  contentEntries.map(file => `${file.sha256}  ${file.path}\n`).join(''),
);
const commitSha = process.env.GITHUB_SHA || '';
const runId = process.env.GITHUB_RUN_ID || '';

if (!/^[0-9a-f]{40}$/.test(commitSha)) {
  fail('GITHUB_SHA must be a lowercase 40-character commit SHA in GitHub Actions');
}
if (!/^[1-9]\d*$/.test(runId)) {
  fail('GITHUB_RUN_ID must be a positive-integer string in GitHub Actions');
}

const metadata = {
  commitSha,
  runId,
};

writeFileSync(
  resolve(buildDir, metadataFilename),
  `${JSON.stringify(metadata, null, 2)}\n`,
  'utf8',
);

const checksumEntries = fileEntries(
  listFiles(buildDir, new Set([checksumsFilename])),
);
writeFileSync(
  resolve(buildDir, checksumsFilename),
  checksumEntries.map(file => `${file.sha256}  ${file.path}`).join('\n') + '\n',
  'utf8',
);

console.log(
  `Verified ${contentEntries.length} build files (${totalBytes} bytes, content sha256 ${contentSha256})`,
);
