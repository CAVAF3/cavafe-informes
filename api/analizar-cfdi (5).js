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

    const prompt = `Eres un experto en facturas CFDI mexicanas. IMPORTANTE: El CFDI puede estar dividido en 2 imágenes.

PASO 1: IDENTIFICA qué contiene cada imagen:
- ¿La imagen 1 tiene el encabezado con datos generales?
- ¿La imagen 1 tiene la "Cadena Original del SAT" al final?
- ¿La imagen 2 tiene la continuación con la "Cadena Original"?
- ¿Dónde está el código QR? (imagen 1 o 2)

PASO 2: Para CADA campo, identifica en QUÉ IMAGEN está antes de dar coordenadas.

CAMPOS A BUSCAR Y SU UBICACIÓN TÍPICA:

**CAMPOS DEL ENCABEZADO** (usualmente en imagen 1):
1. **FECHA Y HORA DE EMISIÓN**: Fecha/hora en formato ISO o texto
2. **FOLIO FISCAL (UUID)**: Código largo con guiones (36 caracteres)
3. **NO. CERTIFICADO SAT**: Número de ~20 dígitos

**CAMPOS DE LA CADENA ORIGINAL** (puede estar en imagen 1 o 2):
La "Cadena Original del Complemento de Certificación Digital del SAT" es una sección con:
- Texto largo con separadores |
- Letra pequeña
- Fondo gris o blanco
- Contiene: fecha, UUID, sellos, certificado

4. **FECHA EN CADENA ORIGINAL**: La fecha dentro de la cadena
5. **FOLIO EN CADENA ORIGINAL**: El UUID dentro de la cadena
6. **SELLO DIGITAL DEL CFDI**: Bloque grande de texto alfanumérico (puede estar antes o después de la cadena)
7. **SELLO EN CADENA ORIGINAL**: Otro sello largo dentro de la cadena (dividir en 2 partes)
8. **CERTIFICADO EN CADENA**: El número de certificado dentro de la cadena

**CÓDIGO QR** (puede estar en cualquier imagen):
9. **QR**: Cuadrado negro, usualmente esquina inferior

---

ESTRATEGIA PARA IDENTIFICAR UBICACIONES:

1. **Analiza AMBAS imágenes completamente**
2. **Busca la "Cadena Original"** - esta es la clave:
   - Si está en la imagen 1 → todos los campos de cadena están en imagen 1
   - Si está en la imagen 2 → todos los campos de cadena están en imagen 2
3. **Busca el QR** - puede estar en cualquiera de las dos
4. **Para cada campo, especifica claramente: "imagen": 1 o "imagen": 2**

---

USA PORCENTAJES RELATIVOS A CADA IMAGEN:
- x_percent: 0-100 (0=izquierda, 100=derecha)
- y_percent: 0-100 (0=arriba imagen, 100=abajo imagen)
- width_percent: ancho del recorte
- height_percent: alto del recorte

EJEMPLO DE ANÁLISIS:

Si la cadena original está en la IMAGEN 2:
```
"fecha_encabezado": {
  "imagen": 1,  ← en imagen 1
  "descripcion": "Imagen 1: arriba a la izquierda",
  "x_percent": 12, "y_percent": 8, "width_percent": 20, "height_percent": 2.5
},
"fecha_cadena_original": {
  "imagen": 2,  ← en imagen 2 (donde está la cadena)
  "descripcion": "Imagen 2: dentro de la cadena original, parte superior",
  "x_percent": 8, "y_percent": 15, "width_percent": 22, "height_percent": 2
}
```

Si TODO está en la IMAGEN 1:
```
"fecha_encabezado": {
  "imagen": 1,
  "descripcion": "Imagen 1: parte superior",
  "x_percent": 12, "y_percent": 8, ...
},
"fecha_cadena_original": {
  "imagen": 1,  ← también en imagen 1
  "descripcion": "Imagen 1: parte inferior, dentro de cadena original",
  "x_percent": 8, "y_percent": 85, ...
}
```

---

FORMATO JSON COMPLETO:

{
  "fecha_emision": "texto exacto",
  "emisor_nombre": "texto exacto",
  "emisor_rfc": "RFC",
  "receptor_nombre": "texto exacto",
  "receptor_rfc": "RFC",
  "folio_fiscal": "UUID completo",
  "no_certificado": "número",
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
  
  "estructura_documento": {
    "cadena_original_en_imagen": 1 o 2,
    "qr_en_imagen": 1 o 2,
    "notas": "Descripción de qué contiene cada imagen"
  },
  
  "coordenadas_recortes": {
    "fecha_encabezado": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está exactamente",
      "x_percent": 12,
      "y_percent": 8,
      "width_percent": 20,
      "height_percent": 2.5
    },
    "fecha_cadena_original": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 8,
      "y_percent": 88,
      "width_percent": 22,
      "height_percent": 2
    },
    "folio_encabezado": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 15,
      "y_percent": 12,
      "width_percent": 50,
      "height_percent": 2.5
    },
    "folio_cadena_original": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 8,
      "y_percent": 90,
      "width_percent": 52,
      "height_percent": 2
    },
    "sello_cfdi": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 10,
      "y_percent": 60,
      "width_percent": 75,
      "height_percent": 8
    },
    "sello_cadena_original_parte1": {
      "imagen": 1 o 2,
      "descripcion": "Primera mitad del sello en cadena",
      "x_percent": 8,
      "y_percent": 92,
      "width_percent": 70,
      "height_percent": 2.5
    },
    "sello_cadena_original_parte2": {
      "imagen": 1 o 2,
      "descripcion": "Segunda mitad del sello en cadena",
      "x_percent": 8,
      "y_percent": 94.5,
      "width_percent": 70,
      "height_percent": 2.5
    },
    "certificado_encabezado": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 15,
      "y_percent": 15,
      "width_percent": 25,
      "height_percent": 2.5
    },
    "certificado_cadena": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 8,
      "y_percent": 97,
      "width_percent": 28,
      "height_percent": 2
    },
    "codigo_qr": {
      "imagen": 1 o 2,
      "descripcion": "Dónde está",
      "x_percent": 5,
      "y_percent": 72,
      "width_percent": 12,
      "height_percent": 12
    }
  }
}

CRÍTICO:
1. ANALIZA AMBAS IMÁGENES antes de dar coordenadas
2. IDENTIFICA dónde está la "Cadena Original" (imagen 1 o 2)
3. Para CADA campo, especifica "imagen": 1 o "imagen": 2 correctamente
4. Los porcentajes son RELATIVOS a cada imagen (no a la combinación)
5. Para el QR: width_percent = height_percent

Responde SOLO JSON válido.`;

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
