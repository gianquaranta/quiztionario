# Quiztionario Backend

Backend independiente para la aplicación Quiztionario con Socket.IO.

## 🚀 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

```bash
npm run dev
```

## 🌐 Producción

```bash
npm start
```

## 📋 Variables de Entorno

Crea un archivo `.env` con:

```env
PORT=3001
FRONTEND_URL=https://tu-frontend.vercel.app
```

## 🚀 Despliegue

### Railway

1. Conecta tu repositorio a [Railway](https://railway.app)
2. Configura las variables de entorno
3. Despliega automáticamente

### Render

1. Conecta tu repositorio a [Render](https://render.com)
2. Configura las variables de entorno
3. Despliega automáticamente

### Heroku

1. Instala Heroku CLI
2. Ejecuta:
```bash
heroku create tu-app-backend
heroku config:set FRONTEND_URL=https://tu-frontend.vercel.app
git push heroku main
```

## 📚 API Endpoints

- `GET /` - Información del servidor
- `GET /health` - Estado del servidor
- `Socket.IO /socket.io` - Conexión WebSocket

## 🔧 Eventos Socket.IO

### Profesor
- `create-quiz` - Crear nuevo quiz
- `start-quiz` - Iniciar quiz
- `next-question` - Siguiente pregunta

### Estudiante
- `join-quiz` - Unirse a quiz
- `submit-answer` - Enviar respuesta
- `get-leaderboard` - Obtener clasificación

## 📝 Estructura del Proyecto

```
quiztionario-backend/
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── .env               # Variables de entorno
├── .gitignore         # Archivos ignorados
└── README.md          # Documentación
```
