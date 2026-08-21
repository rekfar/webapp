/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Absolute base URL for the Rekfar API, overriding the relative `/api` that
   * goes through the dev-server and Netlify proxies. Include the version:
   * `https://rekfar-api.example.azurecontainerapps.io/v1`.
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
