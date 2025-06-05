// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Make sure to import 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // This is the crucial part
            '@': path.resolve(__dirname, './src'),
        },
    },
});
