import { defineConfig } from 'vite';

export default defineConfig({
  // 使用相對路徑，讓 GitHub Pages 在任何 repository 名稱下都能正確載入資源
  base: './',
});
