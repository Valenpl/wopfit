import { defineConfig } from '@playwright/test';

// Corre contra el front en modo desarrollo (con React.StrictMode) y el backend con la base H2 en memoria.
// Si ya tenés los dos levantados, los reutiliza.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:5173', channel: process.env.PW_CHANNEL || undefined },
  webServer: [
    { command: 'mvn spring-boot:run -Dspring-boot.run.profiles=h2', cwd: '../backend', url: 'http://localhost:8080/api/v1/health', reuseExistingServer: true, timeout: 180_000 },
    { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true }
  ]
});
