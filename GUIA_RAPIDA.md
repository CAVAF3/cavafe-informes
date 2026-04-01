# 📚 GUÍA RÁPIDA - CAVAFE CON VERCEL

## ✅ LO QUE NECESITAS:

1. ✓ Cuenta de GitHub (gratis): https://github.com
2. ✓ Cuenta de Vercel (gratis): https://vercel.com  
3. ✓ API Key de Anthropic: https://console.anthropic.com
4. ✓ $5-10 USD de crédito en Anthropic (para empezar)

---

## 🚀 PASO A PASO (15 minutos):

### 1️⃣ Crear Repositorio en GitHub (3 min)

```bash
# En tu computadora:
cd cavafe-proyecto
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU-USUARIO/cavafe.git
git push -u origin main
```

### 2️⃣ Conectar con Vercel (2 min)

1. Ve a https://vercel.com
2. Click "Import Project"
3. Selecciona tu repo de GitHub "cavafe"
4. Click "Import"

### 3️⃣ Configurar Variable de Entorno (1 min)

En Vercel:
1. Settings → Environment Variables
2. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-...` (tu API key)
3. Save

### 4️⃣ Desplegar (1 min)

- Vercel despliega automáticamente
- Espera ~1 min
- Te da una URL: `https://cavafe-xxx.vercel.app`

### 5️⃣ Probar (5 min)

1. Abre la URL
2. Llena datos del caso
3. Sube documentos
4. Click "Analizar"
5. ¡Listo!

---

## 💡 TIPS:

- **Cada vez que hagas cambios**: solo haz `git push` y Vercel redespliega automáticamente
- **Ver errores**: Vercel → tu proyecto → Functions → Logs
- **Costos**: ~$0.50-1 USD por informe (depende de cuántas imágenes)

---

## 🐛 TROUBLESHOOTING:

**Error: "API key not found"**
→ Verifica que agregaste `ANTHROPIC_API_KEY` en Vercel

**Error: "Insufficient credits"**
→ Agrega créditos en console.anthropic.com

**Tarda mucho**
→ Normal con muchas imágenes (10-30 seg)

**Respuesta vacía**
→ Revisa los logs en Vercel para ver el error específico

