import docxPkg from "docx";
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } = docxPkg;
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

    // CARGAR RECURSOS
    const assetsPath = path.join(process.cwd(), "public", "assets");
    console.log(`📁 Buscando recursos en: ${assetsPath}`);
    
    let oficio1, oficio2, oficio3, oficio4, logoCavafe, firmaManuel;
    
    try {
      if (!fs.existsSync(assetsPath)) {
        throw new Error(`Directorio ${assetsPath} no existe`);
      }

      const filesInAssets = fs.readdirSync(assetsPath);
      console.log(`📂 Archivos en assets:`, filesInAssets);

      const oficioPath1 = path.join(assetsPath, "oficio_1.png");
      const oficioPath2 = path.join(assetsPath, "oficio_2.png");
      const oficioPath3 = path.join(assetsPath, "oficio_3.png");
      const oficioPath4 = path.join(assetsPath, "oficio_4.png");
      const logoPath = path.join(assetsPath, "logo-cavafe.png");
      const firmaPath = path.join(assetsPath, "firma-manuel.png");

      if (!fs.existsSync(oficioPath1)) throw new Error("oficio_1.png no encontrado");
      if (!fs.existsSync(oficioPath2)) throw new Error("oficio_2.png no encontrado");
      if (!fs.existsSync(oficioPath3)) throw new Error("oficio_3.png no encontrado");
      if (!fs.existsSync(oficioPath4)) throw new Error("oficio_4.png no encontrado");
      if (!fs.existsSync(logoPath)) throw new Error("logo-cavafe.png no encontrado");
      if (!fs.existsSync(firmaPath)) throw new Error("firma-manuel.png no encontrado");

      oficio1 = fs.readFileSync(oficioPath1);
      oficio2 = fs.readFileSync(oficioPath2);
      oficio3 = fs.readFileSync(oficioPath3);
      oficio4 = fs.readFileSync(oficioPath4);
      logoCavafe = fs.readFileSync(logoPath);
      firmaManuel = fs.readFileSync(firmaPath);
      
      console.log("✅ Recursos cargados correctamente");
      console.log(`   - Logo CAVAFE: ${logoCavafe.length} bytes`);
      console.log(`   - Firma: ${firmaManuel.length} bytes`);

    } catch (assetError) {
      console.error("❌ Error cargando recursos:", assetError.message);
      return res.status(500).json({ 
        error: "Error cargando recursos",
        details: assetError.message 
      });
    }

    // PROCESAR IMÁGENES DE LA FACTURA
    const facturaImagenes = [];
    
    for (let i = 0; i < imagenes.length; i++) {
      try {
        const img = imagenes[i];
        
        if (!img.data) {
          console.warn(`⚠️ Imagen ${i + 1} no tiene data, saltando...`);
          continue;
        }

        // Filtrar PDFs (no se pueden insertar como imagen)
        if (img.type === 'application/pdf') {
          console.warn(`⚠️ Archivo ${i + 1} es PDF, no se puede insertar como imagen`);
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
      }
    }

    if (facturaImagenes.length === 0) {
      console.error("❌ No se pudo procesar ninguna imagen");
      return res.status(400).json({ 
        error: "No se pudieron procesar las imágenes de la factura" 
      });
    }

    console.log(`✅ ${facturaImagenes.length} imagen(es) de factura procesada(s)`);

    // HELPER: Crear header con logo
    const createHeader = () => [
      new Paragraph({
        children: [
          new ImageRun({
            data: logoCavafe,
            transformation: { width: 200, height: 45 },
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "INFORME DE INVESTIGACIÓN.",
            font: "Times New Roman",
            size: 28,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    ];

    // GENERAR DOCUMENTO
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
            // Header con logo
            ...createHeader(),

            // Referencia
            new Paragraph({
              children: [
                new TextRun({
                  text: `REFERENCIA: SIN. ${datosCaso.no_siniestro || 'N/A'}`,
                  font: "Times New Roman",
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
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
                  text: "Qualitas compañía de seguros nos solicita realizar la verificación de autenticidad de una factura y/o CFDI emitido el día ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.fecha_emision || "--", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ", por la persona física o moral denominada ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.emisor_nombre || "--", 
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
                  text: analisisIA.receptor_nombre || "--", 
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
                  text: analisisIA.marca || "--", 
                  bold: true, 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ", modelo ", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: analisisIA.modelo || "--", 
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
                  text: analisisIA.serie || "--", 
                  font: "Times New Roman", 
                  size: 22 
                }),
                new TextRun({ 
                  text: ".", 
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            // Espaciado
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            // HIPÓTESIS
            new Paragraph({
              children: [
                new TextRun({ text: "HIPÓTESIS: ", bold: true, font: "Times New Roman", size: 22 }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "La hipótesis proporciona a la investigación la idea directriz, que debe ser mantenida o rectificada una vez obtenidos los resultados de la misma; al respecto, planteamos que el comprobante fiscal digital cuestionado presenta alteraciones en su contenido y/o fue emitido de forma irregular.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 300 },
            }),

            // DESARROLLO DE LA INVESTIGACIÓN
            new Paragraph({
              children: [
                new TextRun({ text: "DESARROLLO DE LA INVESTIGACIÓN: ", bold: true, font: "Times New Roman", size: 22 }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "1. ", bold: true, font: "Times New Roman", size: 22 }),
                new TextRun({ 
                  text: `En primera instancia, procedimos a realizar todas las gestiones a nuestro alcance para localizar y entrar en contacto directo con la persona física o moral a quien se le imputa la autoría del documento cuestionado; nos comunicamos con ${analisisIA.emisor_nombre || "el emisor"}...`, 
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            new Paragraph({ text: "" }),

            new Paragraph({
              text: "En resumen y por lo que corresponde a la primera fase de investigación que consistió en localizar y entrar en contacto con la persona física o moral a quien se le imputa la autoría del documento cuestionado, no obtuvimos resultado positivo.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 300 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "2. ", bold: true, font: "Times New Roman", size: 22 }),
                new TextRun({ 
                  text: "Ante la imposibilidad de obtener datos provenientes del emisor del documento, procedimos a verificar si el comprobante fiscal cuestionado se encontraba registrado en las bases de datos del Servicio de Administración Tributaria (SAT).", 
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            new Paragraph({ text: "" }),

            new Paragraph({
              text: `Como resultado de la consulta, obtuvimos que el Comprobante fiscal ${analisisIA.folio_fiscal || "---"} se encuentra registrado en las bases de datos del SAT.`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "Captura de pantalla del resultado de la consulta realizada.",
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            // Aquí normalmente iría la captura del SAT (placeholder)
            new Paragraph({
              text: "[Captura de validación SAT]",
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 400 },
            }),
          ],
        },

        // ==================== PÁGINA 2: FACTURA PARTE 1 ====================
        {
          children: [
            ...createHeader(),

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

        // ==================== PÁGINA 3: FACTURA PARTE 2 ====================
        {
          children: [
            ...createHeader(),

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

        // ==================== PÁGINAS 4-7: OFICIOS SAT ====================
        {
          children: [
            ...createHeader(),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio1,
                  transformation: { width: 500, height: 650 },
                }),
              ],
            }),
          ],
        },
        {
          children: [
            ...createHeader(),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio2,
                  transformation: { width: 500, height: 650 },
                }),
              ],
            }),
          ],
        },
        {
          children: [
            ...createHeader(),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio3,
                  transformation: { width: 500, height: 650 },
                }),
              ],
            }),
          ],
        },
        {
          children: [
            ...createHeader(),
            new Paragraph({
              children: [
                new ImageRun({
                  data: oficio4,
                  transformation: { width: 500, height: 650 },
                }),
              ],
            }),
          ],
        },

        // ==================== PÁGINA 8-12: ANÁLISIS CFDI ====================
        {
          children: [
            ...createHeader(),

            new Paragraph({
              text: "3. Verificación de los datos que conforman la versión impresa del CFDI.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 400 },
            }),

            new Paragraph({
              text: "En este apartado, realizamos un análisis de los datos que aparecen en la versión impresa del CFDI, para verificar si existen anomalías que nos hagan suponer que el siguiente documento fue alterado o modificado.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 300 },
            }),

            new Paragraph({
              text: "Fecha y hora de emisión en el encabezado:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.fecha || "NO COINCIDENTE"}`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              bold: analisisIA.verificaciones?.fecha === "COINCIDENTE",
              spacing: { after: 300 },
            }),

            new Paragraph({
              text: "Folio fiscal del encabezado:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.folio || "NO COINCIDENTE"}`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              bold: analisisIA.verificaciones?.folio === "COINCIDENTE",
              spacing: { after: 300 },
            }),

            new Paragraph({
              text: "Sello digital del CFDI:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.sello || "NO COINCIDENTE"}`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              bold: analisisIA.verificaciones?.sello === "COINCIDENTE",
              spacing: { after: 300 },
            }),

            new Paragraph({
              text: "Número de certificado del SAT:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.certificado || "NO COINCIDENTE"}`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              bold: analisisIA.verificaciones?.certificado === "COINCIDENTE",
              spacing: { after: 400 },
            }),
          ],
        },

        // ==================== PÁGINA 13: CONCLUSIONES ====================
        {
          children: [
            ...createHeader(),

            new Paragraph({
              text: "CONCLUSIONES",
              alignment: AlignmentType.CENTER,
              bold: true,
              font: "Times New Roman",
              size: 24,
              spacing: { after: 400 },
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
              children: [
                new ImageRun({
                  data: firmaManuel,
                  transformation: { width: 150, height: 55 },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 1200, after: 100 },
            }),
            new Paragraph({
              text: "________________________________________",
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
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
    res.setHeader("Content-Disposition", `attachment; filename="Informe_Verificacion_CAVAFE_${datosCaso.no_siniestro || 'SIN'}.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error("❌ Error generando Word:");
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
