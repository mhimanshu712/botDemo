import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte()],
    server: {
        proxy: {
            '/api': 'http://localhost:3000',
            '/chat': 'http://localhost:3000'
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: './index.html',
            },
        },
    },
}); 