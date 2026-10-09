import esbuild from 'esbuild';
import fs from 'node:fs';

async function build() {
  console.log('Bundling backend with esbuild...');

  await esbuild.build({
    entryPoints: {
      app: 'src/app.ts',
      server: 'src/server.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outdir: 'dist',
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
    external: ['pg-native'],
    sourcemap: true,
  });

  // 1. Copy database migrations
  fs.cpSync('src/db/migrations', 'dist/db/migrations', { recursive: true });

  // 2. Write package.json into dist so Node recognizes it as an ES module
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const distPkg = {
    name: pkg.name,
    version: pkg.version,
    type: 'module',
    main: 'app.js',
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));

  // 3. Create dist/index.js alias
  fs.writeFileSync('dist/index.js', "export { default } from './app.js';\nexport * from './app.js';\n");

  console.log('Backend build and bundle completed successfully!');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
