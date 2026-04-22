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

    const prompt = `Eres un experto en análisis de facturas electrónicas mexicanas (CFDI).

TAREA: Analiza CUIDADOSAMENTE las imágenes del CFDI adjuntas y extrae TODOS los datos que aparecen en ellas.

INSTRUCCIONES IMPORTANTES:
1. Lee TODO el texto visible en las imágenes
2. Extrae los datos EXACTOS tal como aparecen
3. Si un campo no está visible, usa null
4. Responde SOLO con JSON, sin explicaciones

DATOS A EXTRAER:

{
  "fecha_emision": "DD de mes de YYYY" (extrae la fecha EXACTA que aparece en el CFDI),
  "emisor_nombre": "Nombre completo del emisor" (busca en "Emisor" o "Razón Social"),
  "emisor_rfc": "RFC del emisor" (busca el RFC del emisor),
  "receptor_nombre": "Nombre completo del receptor" (busca en "Receptor"),
  "receptor_rfc": "RFC del receptor",
  "folio_fiscal": "UUID completo" (busca "Folio Fiscal" o "UUID"),
  "no_certificado": "Número de certificado del SAT",
  "codigo_postal": "Código postal del emisor",
  "marca": "Marca del vehículo si aparece",
  "modelo": "Año/modelo del vehículo si aparece",
  "serie": "VIN/Serie del vehículo si aparece",
  "verificaciones": {
    "fecha": "COINCIDENTE o NO COINCIDENTE" (compara fecha en encabezado vs cadena original),
    "folio": "COINCIDENTE o NO COINCIDENTE" (compara folio en encabezado vs cadena original),
    "sello": "COINCIDENTE o NO COINCIDENTE" (compara sello en encabezado vs cadena original),
    "certificado": "COINCIDENTE o NO COINCIDENTE" (compara certificado en encabezado vs cadena original)
  },
  "conclusion": "autentico o no_autentico" (autentico si TODAS las verificaciones son COINCIDENTE),
  "inconsistencias": [] (lista vacía si es auténtico, o lista de qué no coincide)
}

IMPORTANTE: 
- Extrae los datos EXACTOS que ves en las imágenes
- NO inventes datos
- NO uses ejemplos
- Si no encuentras un dato, usa null
- Las verificaciones deben comparar los datos del CFDI con su cadena original del SAT

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
