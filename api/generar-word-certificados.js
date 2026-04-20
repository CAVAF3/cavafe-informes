import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } from "docx";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { datosCaso, analisisIA, imagenes } = req.body;

    // Cargar imágenes fijas del oficio (deben estar en /public/assets/)
    const assetsPath = path.join(process.cwd(), "public/assets");
    const oficio1 = fs.readFileSync(path.join(assetsPath, "oficio_1.png"));
    const oficio2 = fs.readFileSync(path.join(assetsPath, "oficio_2.png"));
    const oficio3 = fs.readFileSync(path.join(assetsPath, "oficio_3.png"));
    const oficio4 = fs.readFileSync(path.join(assetsPath, "oficio_4.png"));

    // Procesar imágenes de la factura
    const facturaImagenes = imagenes.map(img => {
      const base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
      return Buffer.from(base64Data, 'base64');
    });

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
                  font: "Arial",
                  size: 32,
                  bold: true,
                }),
                new TextRun({
                  text: "INFORME DE INVESTIGACIÓN.",
                  font: "Arial",
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Referencia
            new Paragraph({
              text: `REFERENCIA: SIN. ${datosCaso.no_siniestro}`,
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
              font: "Arial",
              size: 22,
            }),

            // Antecedentes
            new Paragraph({
              children: [
                new TextRun({ text: "ANTECEDENTES:", bold: true, font: "Arial", size: 22 }),
              ],
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: `Qualitas compañía de seguros nos solicita realizar la verificación de autenticidad de un CFDI emitido el día ${analisisIA.fecha_emision} por la persona moral denominada ${analisisIA.emisor_nombre}, en favor de ${analisisIA.receptor_nombre}; en el texto del documento antes descrito, se pretende acreditar la realización de una operación de compra venta de la unidad automotriz de la Marca ${analisisIA.marca} modelo ${analisisIA.modelo}, serie ${analisisIA.serie}`,
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              font: "Arial",
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
              font: "Arial",
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "HIPÓTESIS:", bold: true, font: "Arial", size: 22 })],
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "La hipótesis proporciona a la investigación la idea directriz, que debe ser mantenida o rectificada una vez obtenidos los resultados de la misma; al respecto, lo primero que corresponde desarrollar es el planteamiento del problema, para después darle cause sistemático a la investigación y así obtener la confirmación o no del hecho puesto a consideración. En este caso en particular, la principal línea de investigación se encamino a determinar con objetividad, si el documento antes descrito fue legalmente expedido o se trata de documento apócrifo.",
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              font: "Arial",
              size: 22,
            }),

            new Paragraph({
              children: [new TextRun({ text: "DESARROLLO DE LA INVESTIGACIÓN:", bold: true, font: "Arial", size: 22 })],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "1. ", bold: true, font: "Arial", size: 22 }),
                new TextRun({ text: `En primera instancia, procedimos a realizar todas las gestiones a nuestro alcance para localizar y entrar en contacto directo con la persona moral a quien se le imputa la autoría del documento cuestionado; nos comunicamos con ${analisisIA.emisor_nombre}...`, font: "Arial", size: 22 }),
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
              font: "Arial",
              size: 24,
            }),

            new Paragraph({
              text: "En este apartado, realizamos un análisis de los datos que aparecen en la versión impresa del CFDI, para verificar si existen anomalías que nos hagan suponer que el siguiente documento fue alterado o modificado.",
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
              font: "Arial",
              size: 22,
            }),

            new Paragraph({
              text: "Fecha y hora de emisión en el encabezado:",
              bold: true,
              spacing: { after: 100 },
              font: "Arial",
              size: 22,
            }),
            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones.fecha}`,
              bold: true,
              spacing: { after: 200 },
              font: "Arial",
              size: 22,
            }),

            new Paragraph({
              text: "Folio fiscal del encabezado:",
              bold: true,
              spacing: { after: 100 },
              font: "Arial",
              size: 22,
            }),
            new Paragraph({
              text: analisisIA.folio_fiscal,
              spacing: { after: 100 },
              font: "Arial",
              size: 22,
            }),
            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones.folio}`,
              bold: true,
              spacing: { after: 200 },
              font: "Arial",
              size: 22,
            }),

            new Paragraph({
              text: `Sello digital: ${analisisIA.verificaciones.sello}`,
              bold: true,
              spacing: { after: 200 },
              font: "Arial",
              size: 22,
            }),

            new Paragraph({
              text: `Número de certificado: ${analisisIA.verificaciones.certificado}`,
              bold: true,
              spacing: { after: 200 },
              font: "Arial",
              size: 22,
            }),
          ],
        },

        // ==================== PÁGINA 13: CONCLUSIÓN ====================
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "CAVAFE          ", font: "Arial", size: 32, bold: true }),
                new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Arial", size: 28 }),
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
              font: "Arial",
              size: 26,
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "ÚNICA: ", bold: true, font: "Arial", size: 22 }),
                new TextRun({
                  text: analisisIA.conclusion === "autentico"
                    ? "De acuerdo a la investigación realizada en este siniestro, NO encontramos elementos que desvirtúen la autenticidad del documento sometido a revisión."
                    : `De acuerdo a la investigación realizada en este siniestro, SÍ encontramos elementos que desvirtúen la autenticidad del documento sometido a revisión, específicamente: ${analisisIA.inconsistencias.join(", ")}.`,
                  font: "Arial",
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
              font: "Arial",
            }),
            new Paragraph({
              text: datosCaso.revisor || "LIC. MANUEL TORIZ CHAVARRÍA",
              alignment: AlignmentType.CENTER,
              bold: true,
              font: "Arial",
              size: 22,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=Informe_Recuperacion_${datosCaso.no_siniestro}.docx`);
    res.send(buffer);

  } catch (error) {
    console.error("Error generando Word certificados:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
