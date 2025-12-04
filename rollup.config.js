import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['react', 'vue'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
      }),
      production && terser(),
    ],
  },
  // React integration
  {
    input: 'src/integrations/react/index.ts',
    output: [
      {
        file: 'dist/react/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/react/index.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['react', '../core/Purify', '../core/types'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/react',
      }),
      production && terser(),
    ],
  },
  // Vue integration
  {
    input: 'src/integrations/vue/index.ts',
    output: [
      {
        file: 'dist/vue/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/vue/index.mjs',
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['vue', '../core/Purify', '../core/types'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/vue',
      }),
      production && terser(),
    ],
  },
];
