import { defineConfig, mergeConfig } from 'vite';

import uiConfig from '../packages/ui/vite.config';

export default mergeConfig(
  uiConfig,
  defineConfig({
    root: import.meta.dirname,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      lib: {
        entry: 'src/main.tsx',
        name: 'Prototype',
        formats: ['iife'],
        fileName: () => 'prototype.js',
        cssFileName: 'prototype',
      },
    },
  })
);
