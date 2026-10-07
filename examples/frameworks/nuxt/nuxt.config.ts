export default defineNuxtConfig({
  devtools: { enabled: false },
  app: { head: { title: "OnoDocs Nuxt viewer", link: [{ rel: "stylesheet", href: "/style.css" }] } },
  vite: { server: { fs: { allow: ["../../.."] } } }
});
