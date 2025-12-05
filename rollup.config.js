import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Main bundle with WASM support
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external: ['react', 'vue', '@angular/core', 'rxjs', /^react\//, /^vue\//, /^@angular\//],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
      }),
      copy({
        targets: [
          { src: 'src/wasm/rnnoise.wasm', dest: 'dist/wasm' },
          { src: 'src/wasm/rnnoise.js', dest: 'dist/wasm' }
        ]
      }),
      production && terser(),
    ],
  },
];
