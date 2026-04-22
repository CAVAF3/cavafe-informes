import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  // Validación del método
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. VALIDAR DATOS DE ENTRADA
    const { imagenes } = req.body;

    if (!imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
      return res.status(400).json({ 
        error: "No se recibieron imágenes",
        details: "El campo 'imagenes' debe ser un array con al menos una imagen" 
      });
    }

    // 2. VALIDAR API KEY
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("❌ ANTHROPIC_API_KEY no configurada");
      return res.status(500).json({ 
        error: "Configuración incompleta",
        details: "La API key de Anthropic no está configurada en las variables de entorno" 
      });
    }

    console.log("✅ Iniciando análisis de CFDI");
    console.log(`📸 Procesando ${imagenes.length} imagen(es)`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // 3. PREPARAR IMÁGENES CON VALIDACIÓN
    const imageBlocks = imagenes.map((img, index) => {
      try {
        // Extraer data base64 limpia
        let base64Data = img.data;
        
        // Si viene con prefijo data:image, removerlo
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }

        // Validar que no esté vacío
        if (!base64Data || base64Data.trim() === '') {
          throw new Error(`Imagen ${index + 1} está vacía`);
        }

        return {
          type: "image",
          source: {
            type: "base64",
            media_type: img.type || "image/jpeg",
            data: base64Data,
          },
        };
      } catch (error) {
        console.error(`❌ Error procesando imagen ${index + 1}:`, error.message);
        throw new Error(`Error en imagen ${index + 1}: ${error.message}`);
      }
    });

    console.log("✅ Imágenes preparadas correctamente");

    const prompt = `Eres un experto en análisis de facturas electrónicas mexicanas (CFDI) y documentos relacionados.

TAREA: Analiza CUIDADOSAMENTE TODAS las imágenes adjuntas. Las primeras 1 o 2 imágenes son del CFDI. Si hay más imágenes después, pueden ser correos, respuestas del emisor, u otros documentos.

INSTRUCCIONES IMPORTANTES:
1. Lee TODO el texto visible en TODAS las imágenes
2. Extrae los datos EXACTOS tal como aparecen
3. Para los campos del CFDI, identifica también las coordenadas (x, y, width, height) en píxeles donde aparecen
4. Si un campo no está visible, usa null
5. Responde SOLO con JSON, sin explicaciones

DATOS A EXTRAER DEL CFDI:

{
  "fecha_emision": "DD de mes de YYYY" (fecha EXACTA del CFDI),
  "emisor_nombre": "Nombre completo del emisor",
  "emisor_rfc": "RFC del emisor",
  "receptor_nombre": "Nombre completo del receptor",
  "receptor_rfc": "RFC del receptor",
  "folio_fiscal": "UUID completo",
  "no_certificado": "Número de certificado del SAT",
  "codigo_postal": "Código postal del emisor",
  "marca": "Marca del vehículo si aparece",
  "modelo": "Año/modelo del vehículo si aparece",
  "serie": "VIN/Serie del vehículo si aparece",
  
  "tiene_respuesta_emisor": true o false (¿Hay imagen con correo/carta/respuesta del emisor?),
  "respuesta_emisor": "Texto EXACTO de la respuesta del emisor si existe, null si no hay",
  
  "verificaciones": {
    "fecha": "COINCIDENTE o NO COINCIDENTE",
    "folio": "COINCIDENTE o NO COINCIDENTE",
    "sello": "COINCIDENTE o NO COINCIDENTE",
    "certificado": "COINCIDENTE o NO COINCIDENTE"
  },
  "conclusion": "autentico o no_autentico",
  "inconsistencias": [],
  
  "coordenadas_recortes": {
    "fecha_encabezado": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30} (coordenadas en píxeles donde está la fecha en el encabezado),
    "fecha_cadena_original": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30} (coordenadas donde está la fecha en la cadena original del SAT),
    "folio_encabezado": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30},
    "folio_cadena_original": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30},
    "sello_cfdi": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 60} (sello digital puede ser largo),
    "sello_cadena_original_parte1": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30} (primera parte del sello en cadena original),
    "sello_cadena_original_parte2": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30} (segunda parte si es muy largo),
    "certificado_encabezado": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30},
    "certificado_cadena": {"imagen": 1, "x": 0, "y": 0, "width": 100, "height": 30},
    "codigo_qr": {"imagen": 1, "x": 0, "y": 0, "width": 150, "height": 150}
  }
}

IMPORTANTE sobre coordenadas:
- "imagen": 1 o 2 (cuál de las 2 primeras imágenes del CFDI contiene este campo)
- x, y: posición desde la esquina superior izquierda en píxeles
- width, height: ancho y alto del área a recortar en píxeles
- Si un campo aparece en ambas imágenes, usa la que sea más clara
- Agrega un pequeño margen (10-20px) alrededor del texto para que se vea bien

IMPORTANTE: 
- Extrae los datos EXACTOS que ves en las imágenes
- NO inventes datos
- Si hay un correo/carta de respuesta del emisor, extrae su texto COMPLETO en "respuesta_emisor"
- Las coordenadas deben ser precisas para que los recortes se vean bien
- Si no encuentras un dato, usa null

Responde SOLO con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.`;

    // 4. LLAMAR A ANTHROPIC API
    console.log("🤖 Enviando solicitud a Claude...");
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [...imageBlocks, { type: "text", text: prompt }],
        },
      ],
    });

    console.log("✅ Respuesta recibida de Claude");
    console.log("📊 Tokens usados:", message.usage);

    // 5. PROCESAR RESPUESTA
    if (!message.content || message.content.length === 0) {
      throw new Error("La respuesta de Claude está vacía");
    }

    const responseText = message.content[0].text;
    console.log("📝 Respuesta raw:", responseText);

    // Limpiar respuesta
    let jsonText = responseText.trim();
    
    // Remover markdown si existe
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    jsonText = jsonText.trim();

    // Parsear JSON
    let analisisIA;
    try {
      analisisIA = JSON.parse(jsonText);
      console.log("✅ JSON parseado exitosamente");
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError.message);
      console.error("📄 Texto recibido:", jsonText);
      return res.status(500).json({
        error: "Error parseando respuesta de IA",
        details: parseError.message,
        raw: jsonText
      });
    }

    // 6. VALIDAR CAMPOS REQUERIDOS
    const camposRequeridos = [
      'fecha_emision', 'emisor_nombre', 'emisor_rfc',
      'receptor_nombre', 'receptor_rfc', 'folio_fiscal'
    ];

    const camposFaltantes = camposRequeridos.filter(campo => 
      !analisisIA[campo] || analisisIA[campo] === null || analisisIA[campo] === ""
    );

    if (camposFaltantes.length > 0) {
      console.warn("⚠️ Campos faltantes en el análisis:", camposFaltantes);
    }

    console.log("✅ Análisis completado exitosamente");

    // 7. RETORNAR RESULTADO
    res.status(200).json({
      success: true,
      analisisIA,
      tokens_usados: message.usage,
    });

  } catch (error) {
    console.error("❌ Error en análisis de CFDI:");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      error: "Error en el análisis del CFDI",
      message: error.message,
      stack: error.stack,
    });
  }
}
