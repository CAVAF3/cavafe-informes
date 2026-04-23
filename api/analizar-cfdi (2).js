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

    const prompt = `Eres un experto en análisis de facturas electrónicas mexicanas (CFDI) y visión computacional.

TAREA: Analiza las imágenes del CFDI y extrae coordenadas PRECISAS de los campos.

PASO 1 - ANALIZAR DIMENSIONES:
Primero observa las dimensiones de cada imagen. Las coordenadas deben estar en píxeles relativos al tamaño de la imagen.

PASO 2 - IDENTIFICAR CAMPOS CON PRECISIÓN:
Para cada campo, identifica:
- La posición EXACTA donde empieza el texto (x, y desde esquina superior izquierda)
- El ancho y alto del área que contiene TODO el texto del campo
- Agrega 10-15px de margen alrededor para que se vea completo

CAMPOS CRÍTICOS A LOCALIZAR:

1. FECHA ENCABEZADO: Busca donde dice "Fecha y hora de emisión" o similar en la parte superior
2. FECHA CADENA ORIGINAL: Busca en la sección de "Cadena Original" del SAT, usualmente abajo
3. FOLIO ENCABEZADO: UUID largo (ej: BE3893D6C-4094-4F07-99A8-58E8A826186A) en encabezado
4. FOLIO CADENA ORIGINAL: El mismo UUID pero en la cadena original
5. SELLO CFDI: Código largo de letras/números (sello digital) en el documento principal
6. SELLO CADENA ORIGINAL: El sello en la sección de cadena original (dividir en 2 partes si es muy largo)
7. CERTIFICADO ENCABEZADO: Número de certificado del SAT (ej: 00001000000508341381)
8. CERTIFICADO CADENA: El mismo número pero en cadena original
9. CÓDIGO QR: El cuadrado negro con patrón QR (usualmente esquina inferior)

IMPORTANTE SOBRE COORDENADAS:
- x, y: Posición en píxeles desde esquina superior izquierda
- width, height: Ancho y alto en píxeles del área a recortar
- Agrega 15px de padding alrededor del texto
- Si el campo está en la imagen 1, pon "imagen": 1
- Si está en la imagen 2, pon "imagen": 2
- Para el QR: asegúrate de capturar TODO el código QR completo con margen

DATOS A EXTRAER:

{
  "fecha_emision": "DD de mes de YYYY",
  "emisor_nombre": "Nombre completo",
  "emisor_rfc": "RFC",
  "receptor_nombre": "Nombre completo",
  "receptor_rfc": "RFC",
  "folio_fiscal": "UUID completo",
  "no_certificado": "Número certificado SAT",
  "codigo_postal": "CP",
  "marca": "Marca vehículo",
  "modelo": "Año/modelo",
  "serie": "VIN/Serie",
  
  "tiene_respuesta_emisor": true o false,
  "respuesta_emisor": "Texto de respuesta o null",
  
  "verificaciones": {
    "fecha": "COINCIDENTE",
    "folio": "COINCIDENTE",
    "sello": "COINCIDENTE",
    "certificado": "COINCIDENTE"
  },
  "conclusion": "autentico",
  "inconsistencias": [],
  
  "coordenadas_recortes": {
    "fecha_encabezado": {"imagen": 1, "x": 100, "y": 50, "width": 250, "height": 40},
    "fecha_cadena_original": {"imagen": 1, "x": 100, "y": 800, "width": 250, "height": 40},
    "folio_encabezado": {"imagen": 1, "x": 100, "y": 100, "width": 500, "height": 40},
    "folio_cadena_original": {"imagen": 1, "x": 100, "y": 850, "width": 500, "height": 40},
    "sello_cfdi": {"imagen": 1, "x": 80, "y": 600, "width": 600, "height": 80},
    "sello_cadena_original_parte1": {"imagen": 1, "x": 80, "y": 900, "width": 600, "height": 50},
    "sello_cadena_original_parte2": {"imagen": 1, "x": 80, "y": 950, "width": 600, "height": 50},
    "certificado_encabezado": {"imagen": 1, "x": 100, "y": 150, "width": 250, "height": 40},
    "certificado_cadena": {"imagen": 1, "x": 100, "y": 1000, "width": 250, "height": 40},
    "codigo_qr": {"imagen": 1, "x": 50, "y": 700, "width": 180, "height": 180}
  }
}

AJUSTA LAS COORDENADAS SEGÚN LO QUE VES EN LA IMAGEN REAL. Los valores de ejemplo son solo referencia.
Responde SOLO con JSON válido, sin texto adicional, sin markdown.`;

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
