# 🚀 INSTRUCCIONES PARA DESPLEGAR CAVAFE EN VERCEL

## PASO 1: Preparar el Proyecto Localmente

1. Descarga este ZIP y descomprímelo
2. Abre una terminal en la carpeta del proyecto
3. Ejecuta: `npm install`

## PASO 2: Configurar Vercel

1. Ve a https://vercel.com y inicia sesión (usa GitHub)
2. Click en "Add New" → "Project"
3. Importa el repositorio de GitHub (o arrastra la carpeta)
4. Vercel detectará automáticamente que es un proyecto React

## PASO 3: Agregar la API Key de Anthropic

1. En Vercel, ve a tu proyecto → Settings → Environment Variables
2. Agrega una nueva variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `tu-api-key-aquí` (ej: sk-ant-...)
   - Scope: Production, Preview, Development
3. Click "Save"

## PASO 4: Desplegar

1. Click "Deploy" en Vercel
2. Espera 1-2 minutos
3. ¡Listo! Tendrás una URL como: https://cavafe.vercel.app

## PASO 5: Usar la App

1. Abre la URL que te dio Vercel
2. Llena los datos del caso
3. Sube los documentos (PDFs, imágenes)
4. Click "Analizar con IA"
5. Espera 10-30 segundos
6. ¡Informe completo generado!

## 🔧 Si algo falla:

- Verifica que la API key esté correcta
- Revisa los logs en Vercel → Functions
- Asegúrate de tener créditos en tu cuenta de Anthropic

## 💰 Costos Estimados:

- Vercel: GRATIS (hasta 100GB bandwidth/mes)
- Anthropic API: ~$0.50-1.00 USD por informe (depende de cuántas imágenes)

## 📝 Próximos Pasos:

Una vez que funcione, podemos:
1. Agregar procesamiento de imágenes (marcos negros, recorte)
2. Mejorar el template HTML de 10 páginas
3. Agregar más validaciones
4. Optimizar el prompt para mejores resultados

