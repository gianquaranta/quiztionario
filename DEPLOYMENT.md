# 🚀 Guía de Despliegue - Quiztionario

## 📋 Resumen
Ahora tienes dos proyectos separados:
- **Frontend** (Next.js) → Despliega en Vercel
- **Backend** (Socket.IO) → Despliega en Railway/Render/Heroku

## 🎯 Paso a Paso

### 1. Desplegar el Backend

#### Opción A: Railway (Recomendado)
1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Selecciona "Deploy from GitHub repo"
4. Selecciona la carpeta `quiztionario-backend`
5. Configura las variables de entorno:
   - `PORT`: Railway lo detecta automáticamente
   - `FRONTEND_URL`: `https://tu-frontend.vercel.app`
6. Despliega y copia la URL generada

#### Opción B: Render
1. Ve a [render.com](https://render.com)
2. Conecta tu repositorio
3. Selecciona "Web Service"
4. Root Directory: `quiztionario-backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Variables de entorno:
   - `FRONTEND_URL`: `https://tu-frontend.vercel.app`

#### Opción C: Heroku
```bash
cd quiztionario-backend
heroku create tu-app-backend
heroku config:set FRONTEND_URL=https://tu-frontend.vercel.app
git subtree push --prefix=quiztionario-backend heroku main
```

### 2. Configurar el Frontend

1. En Vercel, ve a tu proyecto
2. Settings → Environment Variables
3. Agrega:
   - `NEXT_PUBLIC_SOCKET_SERVER_URL`: URL de tu backend (ej: `https://tu-backend.railway.app`)
4. Redespliega el frontend

### 3. Actualizar configuración local

En `quiztionario/.env.local`:
```env
NEXT_PUBLIC_SOCKET_SERVER_URL=https://tu-backend-desplegado.railway.app
```

En `quiztionario-backend/.env`:
```env
FRONTEND_URL=https://tu-frontend.vercel.app
```

## 🧪 Probar la Configuración

### Desarrollo Local
1. Terminal 1 - Backend:
```bash
cd quiztionario-backend
npm install
npm run dev
```

2. Terminal 2 - Frontend:
```bash
cd quiztionario
npm run dev
```

### Producción
1. Frontend: `https://tu-app.vercel.app`
2. Backend: `https://tu-backend.railway.app/health`

## 🔧 Comandos Útiles

### Backend
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm start

# Ver logs en Railway
railway logs
```

### Frontend
```bash
# Variables de entorno de Vercel
vercel env pull

# Desplegar
vercel --prod
```

## 🚨 Solución de Problemas

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurada correctamente en el backend
- Asegúrate de incluir `https://` en las URLs

### Socket no conecta
- Verifica que `NEXT_PUBLIC_SOCKET_SERVER_URL` apunte al backend correcto
- Prueba la ruta `/health` del backend

### Variables de entorno
- En Vercel: Project Settings → Environment Variables
- En Railway: Project → Variables
- Redespliega después de cambiar variables

## 📚 URLs de Ejemplo

### Desarrollo
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Health Check: `http://localhost:3001/health`

### Producción
- Frontend: `https://quiztionario.vercel.app`
- Backend: `https://quiztionario-backend.railway.app`
- Health Check: `https://quiztionario-backend.railway.app/health`

## ✅ Checklist Final

- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Socket.IO conectando exitosamente
- [ ] Prueba creando un quiz
- [ ] Prueba uniéndose a un quiz
