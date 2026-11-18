import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { handleFriday } from './server/friday.js';

// Serves POST /api/friday from the dev server and `vite preview`, with the Groq key read from
// .env on the server side only (no VITE_ prefix, so it never reaches the browser bundle).
function fridayApi(env) {
  // Returns nothing on purpose: Vite treats a returned function as a post-middleware hook.
  const mount = (server) => {
    server.middlewares.use('/api/friday', (req, res) => handleFriday(req, res, env));
  };
  return { name: 'friday-api', configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), fridayApi(env)],
    // "@/..." points at src/, the alias shadcn-style components import from.
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: 5173, strictPort: true },
    // Only scan the site itself for dependencies (not the skill demo pages kept in the folder).
    optimizeDeps: { entries: ['index.html'] },
  };
});
