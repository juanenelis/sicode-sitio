# SICODE — Sitio web (versión sin carpetas, fácil de subir a GitHub)

Todos los archivos están sueltos, sin subcarpetas, para que se puedan subir a GitHub sin
que se pierda ninguna estructura.

## Archivos incluidos
- `index.html`
- `main.jsx`
- `App.jsx`
- `firebase.js`
- `storage.js`
- `cloudinary.js`
- `email.js`
- `package.json`
- `vite.config.js`
- `.gitignore`

## Cómo subir a GitHub
1. Borra los archivos que ya subiste antes en el repositorio (para empezar limpio).
2. Sube estos archivos sueltos, todos a la vez, arrastrándolos directamente
   (no hace falta arrastrar ninguna carpeta).
3. Conecta el repositorio en Netlify con:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: (vacío)
