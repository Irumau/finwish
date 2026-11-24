import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  // Los paquetes internos (@finwish/*) están escritos en TypeScript: se empaquetan dentro del build.
  noExternal: [/^@finwish\//],
});
