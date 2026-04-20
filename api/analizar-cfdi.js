import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  // Validación del método
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. VALIDAR DATOS DE ENTRADA
    const { imagenes, datosCaso } = req.body;

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

    console.log("✅ Iniciando análisis con Anthropic API");
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

    const prompt = `Analiza este CFDI (factura electrónica mexicana) y extrae la siguiente información con precisión.

IMPORTANTE: Responde SOLO con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

Necesito extraer:

1. DATOS GENERALES:
   - fecha_emision: Fecha completa en formato "DD de MMMM de YYYY" (ejemplo: "13 de mayo de 2025")
   - emisor_nombre: Nombre completo de quien emite la factura
   - emisor_rfc: RFC del emisor
   - receptor_nombre: Nombre completo del receptor (a favor de quien)
   - receptor_rfc: RFC del receptor
   - folio_fiscal: Folio fiscal UUID completo
   - no_certificado: Número de certificado del SAT
   - codigo_postal: Código postal del domicilio fiscal del emisor

2. DATOS DEL VEHÍCULO (extraer si existe en la factura):
   - marca: Marca del vehículo
   - modelo: Año/modelo del vehículo
   - serie: Número de serie o VIN completo

3. VERIFICACIONES (compara estos datos entre el encabezado y la cadena original del SAT):
   - Fecha y hora: comparar fecha/hora en encabezado vs fecha en cadena original SAT
   - Folio fiscal: comparar folio en encabezado vs folio en cadena original SAT
   - Sello digital: comparar sello del CFDI vs sello en cadena original SAT
   - Certificado: comparar número de certificado en encabezado vs cadena original SAT

Para cada verificación determina: "COINCIDENTE" o "NO COINCIDENTE"

4. ANÁLISIS FINAL:
   - Si TODAS las verificaciones son COINCIDENTE: conclusion = "autentico", inconsistencias = []
   - Si alguna verificación es NO COINCIDENTE: conclusion = "no_autentico", inconsistencias = ["lista de qué no coincide"]

Formato de respuesta (SOLO este JSON, sin código markdown, sin explicaciones):

{
  "fecha_emision": "13 de mayo de 2025",
  "emisor_nombre": "Comercializadora de Carrocerías Busscar de México",
  "emisor_rfc": "CAB140619SS3",
  "receptor_nombre": "Tours Reyes",
  "receptor_rfc": "TREB08121238",
  "folio_fiscal": "F89CDFC2-3051-11FO-81E7-45C6A45137D0",
  "no_certificado": "00001000000502098",
  "codigo_postal": "42185",
  "marca": "Busscar",
  "modelo": "2025",
  "serie": "9BSK6X20XS40898",
  "verificaciones": {
    "fecha": "COINCIDENTE",
    "folio": "COINCIDENTE",
    "sello": "COINCIDENTE",
    "certificado": "COINCIDENTE"
  },
  "conclusion": "autentico",
  "inconsistencias": []
}`;

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
    console.log("📝 Respuesta de Claude (primeros 200 chars):", responseText.substring(0, 200));

    // 6. EXTRAER Y VALIDAR JSON
    let analisis;
    try {
      // Limpiar respuesta de markdown
      let cleaned = responseText.trim();
      
      // Remover bloques de código markdown
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Intentar parsear directamente
      analisis = JSON.parse(cleaned);
      console.log("✅ JSON parseado exitosamente");
      
    } catch (parseError) {
      console.log("⚠️ Parse directo falló, intentando extraer JSON...");
      
      // Intentar extraer JSON con regex
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          analisis = JSON.parse(jsonMatch[0]);
          console.log("✅ JSON extraído y parseado exitosamente");
        } catch (e) {
          console.error("❌ Error parseando JSON extraído:", e.message);
          throw new Error(`No se pudo parsear el JSON extraído: ${e.message}`);
        }
      } else {
        console.error("❌ No se encontró JSON en la respuesta");
        console.error("Respuesta completa:", responseText);
        throw new Error("No se pudo extraer JSON de la respuesta de IA");
      }
    }

    // 7. VALIDAR ESTRUCTURA DEL ANÁLISIS
    const camposRequeridos = ['fecha_emision', 'emisor_nombre', 'emisor_rfc', 
                              'receptor_nombre', 'receptor_rfc', 'folio_fiscal'];
    
    const camposFaltantes = camposRequeridos.filter(campo => !analisis[campo]);
    
    if (camposFaltantes.length > 0) {
      console.warn("⚠️ Campos faltantes en el análisis:", camposFaltantes);
      // No falla, solo advierte
    }

    console.log("✅ Análisis completado exitosamente");
    return res.status(200).json({ analisis });

  } catch (error) {
    // MANEJO DETALLADO DE ERRORES
    console.error("❌ ERROR EN ANÁLISIS CFDI:");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);

    // Detectar tipo de error
    let errorResponse = {
      error: "Error en análisis IA",
      message: error.message,
      type: error.constructor.name,
    };

    // Errores específicos de Anthropic
    if (error.message?.includes('api_key')) {
      errorResponse.details = "API key inválida o no configurada";
      errorResponse.solucion = "Verifica ANTHROPIC_API_KEY en variables de entorno de Vercel";
    } else if (error.message?.includes('rate_limit')) {
      errorResponse.details = "Límite de solicitudes excedido";
      errorResponse.solucion = "Espera un momento e intenta de nuevo";
    } else if (error.message?.includes('timeout')) {
      errorResponse.details = "Tiempo de espera agotado";
      errorResponse.solucion = "La imagen puede ser muy grande, intenta con una imagen más pequeña";
    } else if (error.message?.includes('overloaded')) {
      errorResponse.details = "Servicio temporalmente sobrecargado";
      errorResponse.solucion = "Intenta de nuevo en unos segundos";
    } else if (error.message?.includes('imagen')) {
      errorResponse.details = "Error procesando las imágenes";
      errorResponse.solucion = "Verifica que las imágenes estén en formato correcto (JPEG/PNG)";
    } else {
      errorResponse.details = error.stack;
    }

    return res.status(500).json(errorResponse);
  }
}
