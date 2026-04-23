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

    const prompt = `Eres un experto en facturas CFDI mexicanas. Analiza la imagen con MÁXIMA ATENCIÓN.

PASO 1: IDENTIFICA Y DESCRIBE la ubicación de cada campo en LENGUAJE NATURAL.
PASO 2: Basándote en tu descripción, da coordenadas precisas.

CAMPOS A BUSCAR:

1. **FECHA Y HORA DE EMISIÓN (encabezado)**:
   - Texto que dice la fecha/hora (ej: "2022-09-14T15:57:59" o "14 de septiembre de 2022")
   - DESCRIBE: ¿Está arriba a la izquierda? ¿Arriba al centro? ¿En qué parte del encabezado?
   - RECORTA: Solo los dígitos/texto de la fecha (sin el label "Fecha:")

2. **FECHA EN LA CADENA ORIGINAL**:
   - Busca la sección llamada "Cadena Original del Complemento de Certificación Digital del SAT"
   - Es una línea larga de texto pequeño, generalmente en la parte INFERIOR
   - Dentro de esa cadena, busca una fecha similar a la del encabezado
   - DESCRIBE: ¿En qué línea está? ¿Cerca del inicio, medio o final de la página?

3. **FOLIO FISCAL / UUID (encabezado)**:
   - Código largo con guiones: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
   - DESCRIBE: ¿Dónde está en el encabezado? ¿Línea horizontal o vertical?

4. **FOLIO FISCAL EN CADENA ORIGINAL**:
   - El MISMO código UUID pero dentro de la "Cadena Original"
   - DESCRIBE: ¿En qué parte de la cadena original está?

5. **SELLO DIGITAL DEL CFDI**:
   - Bloque GRANDE de texto alfanumérico (200-400 caracteres)
   - Puede estar en 2-5 líneas
   - DESCRIBE: ¿Está en el centro? ¿Abajo? ¿Cuántas líneas ocupa?

6. **SELLO EN CADENA ORIGINAL**:
   - Otro sello largo dentro de la "Cadena Original"
   - Si es muy largo, divídelo en 2 mitades
   - DESCRIBE: ¿Dónde empieza y termina dentro de la cadena?

7. **NÚMERO DE CERTIFICADO SAT (encabezado)**:
   - Número largo de ~20 dígitos (ej: "00001000000508341381")
   - DESCRIBE: ¿Dónde está en el encabezado?

8. **CERTIFICADO EN CADENA ORIGINAL**:
   - El mismo número dentro de la cadena original
   - DESCRIBE: ¿En qué parte de la cadena?

9. **CÓDIGO QR**:
   - Cuadrado negro con patrón
   - DESCRIBE: ¿Esquina inferior izquierda o derecha? ¿Qué tan abajo está?
   - MUY IMPORTANTE: Debe ser CUADRADO (mismo ancho y alto)

USA PORCENTAJES (más flexible que píxeles):
- x_percent: 0-100 (0=izquierda, 50=centro, 100=derecha)
- y_percent: 0-100 (0=arriba, 50=medio, 100=abajo)
- width_percent: ancho relativo
- height_percent: alto relativo

ESTRATEGIA PARA PORCENTAJES:
- Observa TODA la imagen primero
- Divide mentalmente en cuadrantes (arriba-izquierda=25%/25%, centro=50%/50%, etc)
- Para cada campo:
  * Identifica en qué cuadrante está
  * Estima su posición dentro de ese cuadrante
  * Agrega 3-5% de margen alrededor

EJEMPLOS DE UBICACIONES:
- "Fecha arriba a la izquierda" → x_percent: 10-20, y_percent: 5-10
- "UUID en el centro superior" → x_percent: 30-40, y_percent: 8-12  
- "Cadena original en la parte inferior" → y_percent: 85-95
- "QR en esquina inferior izquierda" → x_percent: 5-10, y_percent: 75-85
- "QR en esquina inferior derecha" → x_percent: 80-90, y_percent: 75-85

FORMATO JSON:

{
  "fecha_emision": "texto exacto",
  "emisor_nombre": "texto exacto",
  "emisor_rfc": "texto exacto",
  "receptor_nombre": "texto exacto",
  "receptor_rfc": "texto exacto",
  "folio_fiscal": "UUID completo",
  "no_certificado": "número completo",
  "codigo_postal": "CP",
  "marca": "marca si existe",
  "modelo": "modelo si existe",
  "serie": "VIN si existe",
  
  "tiene_respuesta_emisor": false,
  "respuesta_emisor": null,
  
  "verificaciones": {
    "fecha": "COINCIDENTE",
    "folio": "COINCIDENTE",
    "sello": "COINCIDENTE",
    "certificado": "COINCIDENTE"
  },
  "conclusion": "autentico",
  "inconsistencias": [],
  
  "coordenadas_recortes": {
    "fecha_encabezado": {
      "imagen": 1,
      "descripcion": "Arriba a la izquierda, debajo del logo, segunda línea",
      "x_percent": 12,
      "y_percent": 8,
      "width_percent": 20,
      "height_percent": 2.5
    },
    "fecha_cadena_original": {
      "imagen": 1,
      "descripcion": "Parte inferior, dentro de la cadena original, cerca del inicio",
      "x_percent": 8,
      "y_percent": 88,
      "width_percent": 22,
      "height_percent": 2
    },
    "folio_encabezado": {
      "imagen": 1,
      "descripcion": "Centro superior, línea horizontal, bien visible",
      "x_percent": 15,
      "y_percent": 12,
      "width_percent": 50,
      "height_percent": 2.5
    },
    "folio_cadena_original": {
      "imagen": 1,
      "descripcion": "Dentro de cadena original, después de varios campos",
      "x_percent": 8,
      "y_percent": 90,
      "width_percent": 52,
      "height_percent": 2
    },
    "sello_cfdi": {
      "imagen": 1,
      "descripcion": "Centro-inferior, bloque grande de 3-4 líneas de texto",
      "x_percent": 10,
      "y_percent": 60,
      "width_percent": 75,
      "height_percent": 8
    },
    "sello_cadena_original_parte1": {
      "imagen": 1,
      "descripcion": "Primera mitad del sello en cadena original",
      "x_percent": 8,
      "y_percent": 92,
      "width_percent": 70,
      "height_percent": 2.5
    },
    "sello_cadena_original_parte2": {
      "imagen": 1,
      "descripcion": "Segunda mitad del sello en cadena original",
      "x_percent": 8,
      "y_percent": 94.5,
      "width_percent": 70,
      "height_percent": 2.5
    },
    "certificado_encabezado": {
      "imagen": 1,
      "descripcion": "En el encabezado, cerca del folio",
      "x_percent": 15,
      "y_percent": 15,
      "width_percent": 25,
      "height_percent": 2.5
    },
    "certificado_cadena": {
      "imagen": 1,
      "descripcion": "Dentro de cadena original, número de 20 dígitos",
      "x_percent": 8,
      "y_percent": 97,
      "width_percent": 28,
      "height_percent": 2
    },
    "codigo_qr": {
      "imagen": 1,
      "descripcion": "Esquina inferior izquierda, cuadrado negro con patrón",
      "x_percent": 5,
      "y_percent": 72,
      "width_percent": 12,
      "height_percent": 12
    }
  }
}

CRÍTICO:
1. PRIMERO describe dónde ves cada campo
2. LUEGO calcula el porcentaje basándote en esa ubicación
3. Para el QR: width_percent = height_percent (debe ser cuadrado)
4. Los valores de ejemplo son SOLO referencia - usa lo que VES en la imagen
5. Si un campo está en la imagen 2, pon "imagen": 2

Responde SOLO JSON válido, sin markdown.`;

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
