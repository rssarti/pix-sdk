import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const binDir = join(pkgRoot, 'node_modules', '.bin');
const entry = '../../dist/index.cjs';

await mkdir(binDir, { recursive: true });

await writeFile(
  join(binDir, 'pix'),
  `#!/usr/bin/env sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")
exec node "$basedir/${entry}" "$@"
`,
);
await chmod(join(binDir, 'pix'), 0o755);

await writeFile(
  join(binDir, 'pix.cmd'),
  `@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0
node "%dp0%\\..\\..\\dist\\index.cjs" %*
`,
);

await writeFile(
  join(binDir, 'pix.ps1'),
  `#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent
& node "$basedir/../../dist/index.cjs" @args
`,
);
