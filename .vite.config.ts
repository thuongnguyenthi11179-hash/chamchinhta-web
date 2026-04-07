import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/chamchinhta-web/', // THÊM ĐÚNG DÒNG NÀY VÀO ĐÂY
  plugins: [react()],
})