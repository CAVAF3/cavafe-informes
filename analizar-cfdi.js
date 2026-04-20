import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imagenes, datosCaso } = req.body;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Preparar imágenes para Anthropic
    const imageBlocks = imagenes.map(img => ({
      type: "image",
      source: {
        type: "base64",
        media_type: img.type || "image/jpeg",
        data: img.data.split(",")[1] || img.data,
      },
    }));

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

    const responseText = message.content[0].text;
    
    // Limpiar respuesta y extraer JSON
    let analisis;
    try {
      // Quitar markdown si existe
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analisis = JSON.parse(cleaned);
    } catch (e) {
      // Si falla, buscar JSON en el texto
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analisis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se pudo extraer JSON de la respuesta de IA");
      }
    }

    res.status(200).json({ analisis });
  } catch (error) {
    console.error("Error en análisis CFDI:", error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
}
