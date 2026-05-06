import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:       "index.html",
        galerija:   "galerija.html",
        biografije: "biografije.html",
        kontakt:    "kontakt.html",
      },
    },
  },
});
