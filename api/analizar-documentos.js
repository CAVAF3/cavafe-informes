// api/analizar-documentos.js
// Serverless function que corre en Vercel

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // Solo acepta POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, datosCaso } = req.body;
    
    // Validar que vengan datos
    if (!images || !datosCaso) {
      return res.status(400).json({ error: 'Faltan imágenes o datos del caso' });
    }

    // Inicializar cliente de Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY, // Variable de entorno en Vercel
    });

    // Preparar las imágenes en el formato que Anthropic espera
    const imageContent = images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.type || 'image/jpeg',
        data: img.data, // base64 sin el prefijo "data:image/jpeg;base64,"
      }
    }));

    // Detectar si es Robo o Colisión
    const esColision = datosCaso.tipo.toLowerCase().includes('colisión') || datosCaso.tipo.toLowerCase().includes('colision');
    
    // Crear el prompt según el tipo
    let prompt;
    
    if (esColision) {
      // PROMPT PARA AXA COLISIÓN
      prompt = `Eres un investigador de siniestros en México para CAVAFE. Estás analizando un caso de COLISIÓN.

DATOS DEL CASO:
- Empresa: ${datosCaso.empresa}
- Tipo: ${datosCaso.tipo}
- No. Siniestro: ${datosCaso.no_siniestro}
- Asegurado: ${datosCaso.nombre_asegurado}
- Conductor: ${datosCaso.nombre_conductor}
- Vehículo: ${datosCaso.marca} ${datosCaso.modelo}
- VIN: ${datosCaso.no_serie}
- Placas: ${datosCaso.placas}

DOCUMENTOS ADJUNTOS:
${images.map((img, i) => `${i+1}. ${img.category || 'Documento'}`).join('\n')}

TAREA:
Analiza los documentos y genera el contenido para un informe de COLISIÓN. Necesito:

1. DESCRIPCIÓN DE LOS HECHOS: Redacta cómo sucedió el siniestro según las declaraciones.

2. LUGAR DE LOS HECHOS: Describe detalladamente la ubicación exacta (calle, kilómetro, colonia, ciudad, estado).

3. LISTA DE DAÑOS: Enumera TODOS los daños visibles del vehículo siguiendo la técnica de "división segmentaria" (sentido horario, comenzando por la parte frontal).

4. ANÁLISIS TÉCNICO: Analiza la congruencia entre los daños, la versión de hechos, las evidencias fotográficas y el lugar señalado.

5. ANÁLISIS DE RIESGOS ⚠️ [IMPORTANTE]: Detecta TODAS las inconsistencias, problemas o banderas rojas:
   - Daños NO congruentes con la versión declarada
   - Falta de documentación clave
   - Inconsistencias en fechas, lugares, personas
   - Daños preexistentes
   - Posibles indicios de fraude
   - Conductor diferente al asegurado sin justificación
   - Cualquier irregularidad

   Para cada problema detectado, clasifícalo:
   - "CRITICO" = Rechazo recomendado (improcedente)
   - "ALTO" = Advertencia grave, revisar antes de aprobar
   - "MEDIO" = Requiere aclaración adicional
   - "BAJO" = Nota informativa

6. CONCLUSIÓN: Determina si el siniestro es PROCEDENTE o IMPROCEDENTE y justifica.

Responde SOLO en formato JSON así:
{
  "descripcion_hechos": "Según declaraciones del C. [nombre], el siniestro sucedió de la siguiente manera: ...",
  "lugar_hechos": "Carretera/Calle exacta, Colonia, Ciudad, Estado",
  "lista_danos": ["Fascia delantera", "Parrilla", "Marco radiador", ...],
  "lista_danos_texto": "La unidad marca X, tipo Y, modelo Z... fue revisada... presentando los siguientes daños: [lista]",
  "analisis": "Análisis técnico detallado de congruencia...",
  "alertas": [
    {
      "nivel": "CRITICO|ALTO|MEDIO|BAJO",
      "titulo": "Descripción corta del problema",
      "detalle": "Explicación detallada",
      "impacto": "Por qué es importante"
    }
  ],
  "nivel_riesgo": "CRITICO|ALTO|MEDIO|BAJO|NINGUNO",
  "recomendacion": "PROCEDENTE|IMPROCEDENTE|REVISAR",
  "confianza": 85,
  "documentos_faltantes": ["Acta de denuncia", "Fotografía del lugar", ...],
  "conclusiones": "Con base en el análisis técnico-jurídico... se determina que el siniestro es PROCEDENTE/IMPROCEDENTE porque..."
}

Usa información EXACTA de los documentos. Sé profesional y técnico.`;
    } else {
      // PROMPT PARA AXA ROBO (el original)
      prompt = `Eres un investigador de siniestros en México para CAVAFE. Estás analizando un caso de ROBO.

DATOS DEL CASO:
- Empresa: ${datosCaso.empresa}
- Tipo: ${datosCaso.tipo}
- No. Siniestro: ${datosCaso.no_siniestro}
- Asegurado: ${datosCaso.nombre_asegurado}
- Conductor: ${datosCaso.nombre_conductor}
- Vehículo: ${datosCaso.marca} ${datosCaso.modelo}
- VIN: ${datosCaso.no_serie}
- Placas: ${datosCaso.placas}

DOCUMENTOS ADJUNTOS:
${images.map((img, i) => `${i+1}. ${img.category || 'Documento'}`).join('\n')}

TAREA:
Analiza los documentos y extrae TODA la información relevante. Luego redacta el contenido para las siguientes secciones del informe:

1. VERIFICACIÓN DE PÓLIZA (datos, vigencia, coberturas, observaciones)
2. PREEXISTENCIA DEL VEHÍCULO (verificación, testigos, observaciones)
3. CARPETA DE INVESTIGACIÓN (denuncia, CDI, observaciones)
4. LUGAR DE LOS HECHOS (descripción detallada del lugar)
5. ENTREVISTA CON EL ASEGURADO (ratificación de hechos, observaciones)
6. VERIFICACIÓN Y ANÁLISIS (declaraciones, preexistencia, pagos)
7. DOCUMENTOS (REPUVE, tenencias, facturas)
8. CONCLUSIONES (procedente/rechazo/convenio y fundamento)

9. ANÁLISIS DE RIESGOS ⚠️ [IMPORTANTE]: Detecta TODAS las inconsistencias o problemas:
   - Falta de denuncia ante MP
   - Póliza vencida o cancelada
   - REPUVE con reporte de robo previo
   - Inconsistencias en fechas o lugares
   - Asegurado/conductor no coincide con póliza
   - Vehículo con siniestros recientes múltiples
   - Falta de documentación clave
   - Cualquier irregularidad

   Para cada problema detectado, clasifícalo:
   - "CRITICO" = Rechazo recomendado
   - "ALTO" = Advertencia grave
   - "MEDIO" = Requiere aclaración
   - "BAJO" = Nota informativa

Responde SOLO en formato JSON así:
{
  "verificacion_poliza": "...",
  "preexistencia": "...",
  "carpeta_investigacion": "...",
  "lugar_hechos": "...",
  "entrevista": "...",
  "verificacion_analisis": "...",
  "documentos": "...",
  "alertas": [
    {
      "nivel": "CRITICO|ALTO|MEDIO|BAJO",
      "titulo": "Descripción corta",
      "detalle": "Explicación detallada",
      "impacto": "Por qué es importante"
    }
  ],
  "nivel_riesgo": "CRITICO|ALTO|MEDIO|BAJO|NINGUNO",
  "recomendacion": "PROCEDENTE|IMPROCEDENTE|REVISAR",
  "confianza": 85,
  "documentos_faltantes": ["Acta MP", "REPUVE", ...],
  "conclusiones": "..."
}

Escribe en estilo profesional como investigador. Usa la información EXACTA de los documentos.`;
    }

    // Llamar a la API de Anthropic
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageContent
          ]
        }
      ]
    });

    // Extraer la respuesta
    const respuesta = message.content[0].text;
    
    // Intentar parsear como JSON
    let analisis;
    try {
      analisis = JSON.parse(respuesta);
    } catch (e) {
      // Si no es JSON válido, enviar como texto plano
      analisis = { texto_completo: respuesta };
    }

    // Regresar respuesta exitosa
    return res.status(200).json({
      success: true,
      analisis: analisis,
      tokens_usados: message.usage
    });

  } catch (error) {
    console.error('Error en análisis:', error);
    return res.status(500).json({ 
      error: 'Error al analizar documentos',
      detalle: error.message 
    });
  }
}
