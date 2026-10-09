import fs from 'node:fs';

// 1. Copy database migrations
fs.cpSync('src/db/migrations', 'dist/db/migrations', { recursive: true });

// 2. Copy package.json into dist so Node recognizes dist as ES module in serverless lambdas
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const distPkg = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  main: 'app.js',
  dependencies: pkg.dependencies,
};
fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));

// 3. Create dist/index.js alias to app.js
fs.writeFileSync('dist/index.js', "export { default } from './app.js';\nexport * from './app.js';\n");
