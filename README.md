# mi-app-jwt

Proyecto Node.js + Express + PostgreSQL + JWT listo para Railway.

## Despliegue en Railway

1. Sube tu código a GitHub.
2. Crea un nuevo proyecto en Railway y conecta tu repo.
3. Añade un servicio PostgreSQL (Railway lo crea automáticamente).
4. Configura las variables de entorno:
   - `DATABASE_URL` (Railway la provee)
   - `JWT_SECRET` (genera uno seguro)
   - `PORT` (3000)
5. Railway detecta el Dockerfile y despliega automáticamente.

## Scripts útiles
- `npm start` — producción
- `npm run dev` — desarrollo (requiere nodemon)
- `npm run build` — (no hace nada, solo placeholder)

## Migraciones
El script `migrations/create_users.sql` crea la tabla `users` necesaria para autenticación.

## Seguridad
- No subas `.env` a tu repo.
- Usa un `JWT_SECRET` seguro en producción.
