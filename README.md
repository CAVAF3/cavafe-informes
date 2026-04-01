# CAVAFE - Sistema de Informes con IA

## Estructura del Proyecto:

```
cavafe-proyecto/
├── api/
│   └── analizar-documentos.js   # Serverless function (Vercel)
├── public/
│   └── index.html
├── src/
│   └── App.jsx                   # App React principal
├── package.json
├── vercel.json                   # Configuración Vercel
└── README.md
```

## Setup:

1. Clonar este repo
2. `npm install`
3. Agregar API key de Anthropic en Vercel
4. `vercel deploy`

## Uso:

1. Usuario sube documentos
2. Click "Analizar con IA"
3. Sistema procesa y genera informe completo
