import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, datosCaso } = req.body;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Construir el mensaje para Claude
    const imageBlocks = images.map(img => ({
      type: "image",
      source: {
        type: "base64",
        media_type: img.type,
        data: img.data,
      }
    }));

    const prompt = `Eres un investigador de seguros experto. Analiza los siguientes documentos de un caso de siniestro y genera un análisis de riesgo.

DATOS DEL CASO:
${JSON.stringify(datosCaso, null, 2)}

INSTRUCCIONES:
1. Analiza todos los documentos proporcionados
2. Identifica inconsistencias, irregularidades o señales de alerta
3. Clasifica el nivel de riesgo: CRÍTICO, ALTO, MEDIO, BAJO, o NINGUNO
4. Genera alertas específicas con título y detalle

RESPONDE EN FORMATO JSON:
{
  "nivel_riesgo": "CRÍTICO|ALTO|MEDIO|BAJO|NINGUNO",
  "alertas": [
    {"titulo": "Título de la alerta", "detalle": "Explicación detallada"}
  ],
  "recomendacion": "Recomendación para el revisor",
  "confianza": 85
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    const responseText = message.content[0].text;
    
    // Extraer JSON de la respuesta
    let analisis;
    try {
      // Intentar parsear directamente
      analisis = JSON.parse(responseText);
    } catch (e) {
      // Si falla, buscar JSON en la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analisis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo extraer JSON de la respuesta');
      }
    }

    res.status(200).json({ analisis });

  } catch (error) {
    console.error('Error en análisis:', error);
    res.status(500).json({ error: 'Error en análisis IA', details: error.message });
  }
}
