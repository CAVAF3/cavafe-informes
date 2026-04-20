import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } from "docx";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("✅ Iniciando generación de Word certificados");
    
    const { datosCaso, analisisIA, imagenes } = req.body;

    // VALIDACIONES
    if (!datosCaso) {
      console.error("❌ No se recibió datosCaso");
      return res.status(400).json({ error: "Faltan datos del caso" });
    }

    if (!analisisIA) {
      console.error("❌ No se recibió analisisIA");
      return res.status(400).json({ error: "Faltan datos de análisis IA" });
    }

    if (!imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
      console.error("❌ No se recibieron imágenes");
      return res.status(400).json({ error: "Se requieren imágenes de la factura" });
    }

    console.log(`📊 Datos recibidos:`);
    console.log(`   - Siniestro: ${datosCaso.no_siniestro}`);
    console.log(`   - Imágenes: ${imagenes.length}`);
    console.log(`   - Análisis: ${analisisIA.conclusion}`);

    // Validar campos requeridos del análisis
    const camposRequeridos = [
      'fecha_emision', 'emisor_nombre', 'receptor_nombre',
      'marca', 'modelo', 'serie', 'folio_fiscal', 
      'verificaciones', 'conclusion'
    ];
    
    const camposFaltantes = camposRequeridos.filter(campo => !analisisIA[campo]);
    
    if (camposFaltantes.length > 0) {
      console.error("❌ Campos faltantes en analisisIA:", camposFaltantes);
      return res.status(400).json({ 
        error: "Análisis incompleto",
        details: `Faltan campos: ${camposFaltantes.join(", ")}`
      });
    }

    // Validar estructura de verificaciones
    if (!analisisIA.verificaciones || 
        typeof analisisIA.verificaciones !== 'object' ||
        !analisisIA.verificaciones.fecha ||
        !analisisIA.verificaciones.folio) {
      console.error("❌ Estructura de verificaciones inválida");
      return res.status(400).json({ 
        error: "Estructura de verificaciones inválida",
        details: "Se requiere verificaciones.fecha y verificaciones.folio"
      });
    }

    // Cargar imágenes fijas del oficio
    console.log("📂 Cargando imágenes de oficio...");
    const assetsPath = path.join(process.cwd(), "public/assets");
    
    console.log(`📁 Ruta de assets: ${assetsPath}`);
    
    let oficio1, oficio2, oficio3, oficio4;
    
    try {
      // Verificar que el directorio existe
      if (!fs.existsSync(assetsPath)) {
        throw new Error(`Directorio ${assetsPath} no existe`);
      }

      // Listar archivos disponibles
      const filesInAssets = fs.readdirSync(assetsPath);
      console.log(`📋 Archivos en assets:`, filesInAssets);

      // Cargar cada imagen con manejo de errores individual
      const oficioPath1 = path.join(assetsPath, "oficio_1.png");
      const oficioPath2 = path.join(assetsPath, "oficio_2.png");
      const oficioPath3 = path.join(assetsPath, "oficio_3.png");
      const oficioPath4 = path.join(assetsPath, "oficio_4.png");

      if (!fs.existsSync(oficioPath1)) throw new Error("oficio_1.png no encontrado");
      if (!fs.existsSync(oficioPath2)) throw new Error("oficio_2.png no encontrado");
      if (!fs.existsSync(oficioPath3)) throw new Error("oficio_3.png no encontrado");
      if (!fs.existsSync(oficioPath4)) throw new Error("oficio_4.png no encontrado");

      oficio1 = fs.readFileSync(oficioPath1);
      oficio2 = fs.readFileSync(oficioPath2);
      oficio3 = fs.readFileSync(oficioPath3);
      oficio4 = fs.readFileSync(oficioPath4);
      
      console.log("✅ Imágenes de oficio cargadas correctamente");
      console.log(`   - oficio_1: ${oficio1.length} bytes`);
      console.log(`   - oficio_2: ${oficio2.length} bytes`);
      console.log(`   - oficio_3: ${oficio3.length} bytes`);
      console.log(`   - oficio_4: ${oficio4.length} bytes`);
      
    } catch (fsError) {
      console.error("❌ Error cargando imágenes de oficio:", fsError.message);
      console.error("   Ruta intentada:", assetsPath);
      console.error("   process.cwd():", process.cwd());
      
      return res.status(500).json({ 
        error: "Error cargando plantillas de oficio",
        details: fsError.message,
        path: assetsPath
      });
    }

    // Procesar imágenes de la factura
    console.log("🖼️ Procesando imágenes de factura...");
    const facturaImagenes = [];
    
    for (let i = 0; i < imagenes.length; i++) {
      try {
        const img = imagenes[i];
        
        if (!img.data) {
          console.warn(`⚠️ Imagen ${i + 1} no tiene data, saltando...`);
          continue;
        }

        const base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
        
        if (!base64Data || base64Data.trim() === '') {
          console.warn(`⚠️ Imagen ${i + 1} está vacía, saltando...`);
          continue;
        }

        const buffer = Buffer.from(base64Data, 'base64');
        facturaImagenes.push(buffer);
        console.log(`✅ Imagen ${i + 1} procesada: ${buffer.length} bytes`);
        
      } catch (imgError) {
        console.error(`❌ Error procesando imagen ${i + 1}:`, imgError.message);
        // Continuar con las demás imágenes
      }
    }

    if (facturaImagenes.length === 0) {
      console.error("❌ No se pudo procesar ninguna imagen");
      return res.status(400).json({ 
        error: "No se pudieron procesar las imágenes de la factura" 
      });
    }

    console.log(`✅ ${facturaImagenes.length} imagen(es) de factura procesada(s)`);

    // Generar documento
    console.log("📝 Generando documento Word...");
    
    const doc = new Document({
      sections: [
        // ==================== PÁGINA 1: ANTECEDENTES ====================
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
          },
          children: [
            // Header
            new Paragraph({
              children: [
                new TextRun({
                  text: "CAVAFE          ",
                  font: "Times New Roman",
                  size: 32,
                  bold: true,
                }),
                new TextRun({
                  text: "INFORME DE INVESTIGACIÓN.",
                  font: "Times New Roman",
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Referencia
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "ANTECEDENTES: ", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: "Qualitas compañía de seguros nos solicita realizar la verificación de autenticidad de un CFDI emitido el día ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.fecha_emision || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: " por la persona moral denominada ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.emisor_nombre || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ", en favor de ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.receptor_nombre || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: "; en el texto del documento antes descrito, se pretende acreditar la realización de una operación de compra venta de la unidad automotriz de la Marca ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.marca || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: " modelo ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.modelo || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ", serie ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.serie || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),
              size: 22,
            }),

            // Antecedentes
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "ANTECEDENTES: ", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: "Qualitas compañía de seguros nos solicita realizar la verificación de autenticidad de un CFDI emitido el día ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.fecha_emision || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: " por la persona moral denominada ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.emisor_nombre || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ", en favor de ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.receptor_nombre || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: "; en el texto del documento antes descrito, se pretende acreditar la realización de una operación de compra venta de la unidad automotriz de la Marca ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.marca || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: " modelo ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.modelo || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ", serie ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.serie || "N/A", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            new Paragraph({
              text: `Qualitas compañía de seguros nos solicita realizar la verificación de autenticidad de un CFDI emitido el día ${analisisIA.fecha_emision} por la persona moral denominada ${analisisIA.emisor_nombre}, en favor de ${analisisIA.receptor_nombre}; en el texto del documento antes descrito, se pretende acreditar la realización de una operación de compra venta de la unidad automotriz de la Marca ${analisisIA.marca} modelo ${analisisIA.modelo}, serie ${analisisIA.serie}`,
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              font: "Times New Roman",
              size: 22,
            }),

            // Recuadro "Documento cuestionado"
            new Paragraph({
              text: "Documento cuestionado.",
              alignment: AlignmentType.CENTER,
              bold: true,
              shading: { fill: "CCCCCC" },
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { before: 200, after: 200 },
              font: "Times New Roman",
              size: 24,
            }),

            // Factura parte 1
            ...(facturaImagenes[0] ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: facturaImagenes[0],
                    transformation: { width: 500, height: 400 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
              })
            ] : []),
          ],
        },

        // ==================== PÁGINA 2: FACTURA PARTE 2 ====================
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            ...(facturaImagenes[1] ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: facturaImagenes[1],
                    transformation: { width: 500, height: 400 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
              })
            ] : []),
          ],
        },

        // ==================== PÁGINA 3: HIPÓTESIS ====================
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "HIPÓTESIS:", bold: true, font: "Times New Roman", size: 22 })],
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "La hipótesis proporciona a la investigación la idea directriz, que debe ser mantenida o rectificada una vez obtenidos los resultados de la misma; al respecto, lo primero que corresponde desarrollar es el planteamiento del problema, para después darle cause sistemático a la investigación y así obtener la confirmación o no del hecho puesto a consideración. En este caso en particular, la principal línea de investigación se encamino a determinar con objetividad, si el documento antes descrito fue legalmente expedido o se trata de documento apócrifo.",
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              font: "Times New Roman",
              size: 22,
            }),

            new Paragraph({
              children: [new TextRun({ text: "DESARROLLO DE LA INVESTIGACIÓN:", bold: true, font: "Times New Roman", size: 22 })],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "1. ", bold: true, font: "Times New Roman", size: 22 }),
                new TextRun({ text: `En primera instancia, procedimos a realizar todas las gestiones a nuestro alcance para localizar y entrar en contacto directo con la persona moral a quien se le imputa la autoría del documento cuestionado; nos comunicamos con ${analisisIA.emisor_nombre}...`, font: "Times New Roman", size: 22 }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),
          ],
        },

        // ==================== PÁGINAS 8-11: OFICIO SAT (FIJAS) ====================
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio1,
                  transformation: { width: 550, height: 700 },
                }),
              ],
            }),
          ],
        },

        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio2,
                  transformation: { width: 550, height: 700 },
                }),
              ],
            }),
          ],
        },

        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio3,
                  transformation: { width: 550, height: 700 },
                }),
              ],
            }),
          ],
        },

        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio4,
                  transformation: { width: 550, height: 700 },
                }),
              ],
            }),
          ],
        },

        // ==================== PÁGINA 12: VERIFICACIONES ====================
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            new Paragraph({
              text: "Verificación de los datos que conforman la versión impresa del CFDI.",
              alignment: AlignmentType.CENTER,
              bold: true,
              shading: { fill: "CCCCCC" },
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { before: 200, after: 200 },
              font: "Times New Roman",
              size: 24,
            }),

            new Paragraph({
              text: "En este apartado, realizamos un análisis de los datos que aparecen en la versión impresa del CFDI, para verificar si existen anomalías que nos hagan suponer que el siguiente documento fue alterado o modificado.",
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              font: "Times New Roman",
              size: 22,
            }),

            new Paragraph({
              text: "Fecha y hora de emisión en el encabezado:",
              bold: true,
              spacing: { after: 100 },
              font: "Times New Roman",
              size: 22,
            }),
            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones.fecha || 'N/A'}`,
              bold: true,
              spacing: { after: 200 },
              font: "Times New Roman",
              size: 22,
            }),

            new Paragraph({
              text: "Folio fiscal del encabezado:",
              bold: true,
              spacing: { after: 100 },
              font: "Times New Roman",
              size: 22,
            }),
            new Paragraph({
              text: analisisIA.folio_fiscal || 'N/A',
              spacing: { after: 100 },
              font: "Times New Roman",
              size: 22,
            }),
            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones.folio || 'N/A'}`,
              bold: true,
              spacing: { after: 200 },
              font: "Times New Roman",
              size: 22,
            }),

            new Paragraph({
              text: `Sello digital: ${analisisIA.verificaciones.sello || 'N/A'}`,
              bold: true,
              spacing: { after: 200 },
              font: "Times New Roman",
              size: 22,
            }),

            new Paragraph({
              text: `Número de certificado: ${analisisIA.verificaciones.certificado || 'N/A'}`,
              bold: true,
              spacing: { after: 200 },
              font: "Times New Roman",
              size: 22,
            }),
          ],
        },

        // ==================== PÁGINA 13: CONCLUSIÓN ====================
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Times New Roman", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            new Paragraph({
              text: "CONCLUSIÓN.",
              alignment: AlignmentType.CENTER,
              bold: true,
              shading: { fill: "F5F5F5" },
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { before: 400, after: 400 },
              font: "Times New Roman",
              size: 26,
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "ÚNICA: ", bold: true, font: "Times New Roman", size: 22 }),
                new TextRun({
                  text: analisisIA.conclusion === "autentico"
                    ? "De acuerdo a la investigación realizada en este siniestro, NO encontramos elementos que desvirtúen la autenticidad del documento sometido a revisión."
                    : `De acuerdo a la investigación realizada en este siniestro, SÍ encontramos elementos que desvirtúen la autenticidad del documento sometido a revisión, específicamente: ${(analisisIA.inconsistencias || []).join(", ")}.`,
                  font: "Times New Roman",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 800 },
            }),

            // Firma
            new Paragraph({
              text: "________________________________________",
              alignment: AlignmentType.CENTER,
              spacing: { before: 1200, after: 200 },
              font: "Times New Roman",
            }),
            new Paragraph({
              text: datosCaso.revisor || "LIC. MANUEL TORIZ CHAVARRÍA",
              alignment: AlignmentType.CENTER,
              bold: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
        },
      ],
    });

    console.log("📦 Empaquetando documento...");
    const buffer = await Packer.toBuffer(doc);
    console.log(`✅ Documento generado: ${buffer.length} bytes`);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=Informe_Recuperacion_${datosCaso.no_siniestro || 'SIN'}.docx`);
    res.send(buffer);

    console.log("🎉 Documento enviado exitosamente");

  } catch (error) {
    console.error("❌ ERROR EN GENERACIÓN DE WORD:");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({ 
      error: "Error generando documento Word",
      message: error.message, 
      stack: error.stack 
    });
  }
}
