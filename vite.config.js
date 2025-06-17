import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  define: {
    // Define global constants
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  server: {
    port: 3000,
    host: true,
    fs: {
      allow: ['..']
    }
  },

  preview: {
    port: 3000,
    host: true
  },

  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-svelte': ['svelte'],
          'vendor-editor': [
            '@tiptap/core',
            '@tiptap/extension-document',
            '@tiptap/extension-paragraph',
            '@tiptap/extension-text',
            '@tiptap/extension-bold',
            '@tiptap/extension-italic',
            '@tiptap/extension-heading',
            '@tiptap/extension-bullet-list',
            '@tiptap/extension-ordered-list',
            '@tiptap/extension-list-item',
            '@tiptap/extension-hard-break',
            '@tiptap/extension-history'
          ],
          'vendor-ui': ['lucide-svelte'],
          'vendor-utils': ['uuid', 'roughjs'] // Note: roughjs not rough-js
        }
      }
    },
    // Optimize bundle size
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },

  optimizeDeps: {
    include: [
      'lucide-svelte',
      '@tiptap/core',
      '@tiptap/extension-document',
      '@tiptap/extension-paragraph',
      '@tiptap/extension-text',
      '@tiptap/extension-bold',
      '@tiptap/extension-italic',
      '@tiptap/extension-heading',
      '@tiptap/extension-bullet-list',
      '@tiptap/extension-ordered-list',
      '@tiptap/extension-list-item',
      '@tiptap/extension-hard-break',
      '@tiptap/extension-history',
      'uuid',
      'roughjs' // Note: roughjs not rough-js
    ],
    // Exclude packages that have SSR issues
    exclude: ['@tiptap/pm']
  },

  ssr: {
    // Handle packages that don't work well with SSR
    noExternal: ['lucide-svelte']
  },

  css: {
    postcss: './postcss.config.js'
  },

});