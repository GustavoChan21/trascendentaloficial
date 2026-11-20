import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const pages = process.env.GITHUB_ACTIONS === 'true'
export default defineConfig({
  base: pages ? '/trascendentaloficial/' : '/',
  plugins: [react()],
  build: { outDir:'dist', assetsDir:'assets' }
})
