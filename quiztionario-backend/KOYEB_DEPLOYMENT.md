# Quiztionario Backend - Koyeb Deployment

## Variables de Entorno para Koyeb

Configura estas variables en tu panel de Koyeb:

```bash
# Puerto (Koyeb lo asigna automáticamente, pero puedes especificar)
PORT=3001

# Entorno
NODE_ENV=production

# URL del frontend para CORS
FRONTEND_URL=https://quiztionario.vercel.app
```

## Variables de Entorno para Vercel (Frontend)

Configura esta variable en tu panel de Vercel:

```bash
NEXT_PUBLIC_SOCKET_SERVER_URL=https://tu-app-koyeb.koyeb.app
```

Reemplaza `tu-app-koyeb` con el nombre real de tu aplicación en Koyeb.

## Verificación del Despliegue

1. **Verifica el servidor backend**:
   - Visita: `https://tu-app-koyeb.koyeb.app/health`
   - Deberías ver un JSON con status "OK"

2. **Verifica Socket.IO**:
   - Visita: `https://tu-app-koyeb.koyeb.app/socket-status`
   - Deberías ver información sobre Socket.IO

3. **Prueba la conexión Socket.IO**:
   - Visita: `https://tu-app-koyeb.koyeb.app/test-socket`
   - Deberías ver una página de prueba que se conecta automáticamente

## Debugging

Si tienes problemas de conexión:

1. Verifica que la variable `NEXT_PUBLIC_SOCKET_SERVER_URL` esté configurada correctamente
2. Revisa los logs de Koyeb para errores del servidor
3. Usa las herramientas de desarrollo del navegador para ver errores de conexión
4. Prueba la conexión directamente en `/test-socket`

## Configuración de CORS

El servidor está configurado para aceptar conexiones desde:
- localhost (desarrollo)
- *.vercel.app (tu frontend)
- *.koyeb.app (el propio servidor)

Si usas otros dominios, agrégalos al array `allowedOrigins` en `server.js`.
