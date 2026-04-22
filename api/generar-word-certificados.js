import docxPkg from "docx";
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle } = docxPkg;
import fs from "fs";
import path from "path";
import sharp from "sharp";

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

    // GENERAR RECORTES DE LA FACTURA
    console.log("📐 Generando recortes de la factura...");
    const recortes = {};
    
    if (analisisIA.coordenadas_recortes) {
      try {
        const coords = analisisIA.coordenadas_recortes;
        
        // Helper: Recortar una región de la imagen
        const recortarImagen = async (nombreRecorte, coordenada) => {
          try {
            if (!coordenada || !coordenada.imagen) {
              console.warn(`⚠️ Coordenada ${nombreRecorte} no válida`);
              return null;
            }
            
            const imagenIndex = coordenada.imagen - 1; // Convertir de 1-based a 0-based
            if (imagenIndex >= facturaImagenes.length) {
              console.warn(`⚠️ Imagen ${coordenada.imagen} no existe para ${nombreRecorte}`);
              return null;
            }
            
            const imagenOriginal = facturaImagenes[imagenIndex];
            
            const recorte = await sharp(imagenOriginal)
              .extract({
                left: Math.max(0, coordenada.x),
                top: Math.max(0, coordenada.y),
                width: coordenada.width,
                height: coordenada.height
              })
              .toBuffer();
            
            console.log(`✅ Recorte ${nombreRecorte} generado: ${recorte.length} bytes`);
            return recorte;
          } catch (error) {
            console.error(`❌ Error recortando ${nombreRecorte}:`, error.message);
            return null;
          }
        };
        
        // Generar todos los recortes
        recortes.fecha_encabezado = await recortarImagen('fecha_encabezado', coords.fecha_encabezado);
        recortes.fecha_cadena_original = await recortarImagen('fecha_cadena_original', coords.fecha_cadena_original);
        recortes.folio_encabezado = await recortarImagen('folio_encabezado', coords.folio_encabezado);
        recortes.folio_cadena_original = await recortarImagen('folio_cadena_original', coords.folio_cadena_original);
        recortes.sello_cfdi = await recortarImagen('sello_cfdi', coords.sello_cfdi);
        recortes.sello_cadena_original_parte1 = await recortarImagen('sello_cadena_original_parte1', coords.sello_cadena_original_parte1);
        recortes.sello_cadena_original_parte2 = await recortarImagen('sello_cadena_original_parte2', coords.sello_cadena_original_parte2);
        recortes.certificado_encabezado = await recortarImagen('certificado_encabezado', coords.certificado_encabezado);
        recortes.certificado_cadena = await recortarImagen('certificado_cadena', coords.certificado_cadena);
        recortes.codigo_qr = await recortarImagen('codigo_qr', coords.codigo_qr);
        
        console.log(`✅ Recortes generados exitosamente`);
      } catch (recorteError) {
        console.error("❌ Error generando recortes:", recorteError.message);
        // Continuamos sin recortes
      }
    } else {
      console.warn("⚠️ No se recibieron coordenadas de recortes");
    }

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

    // TEXTOS FIJOS
    const TEXTOS_FIJOS = {
      hipotesis: "La hipótesis proporciona a la investigación la idea directriz, que debe ser mantenida o rectificada una vez obtenidos los resultados de la misma; al respecto, lo primero que corresponde desarrollar es el planteamiento del problema, para después darle cause sistemático a la investigación y así obtener la confirmación o no del hecho puesto a consideración. En este caso en particular, la principal línea de investigación se encamino a determinar con objetividad, si el documento antes descrito fue legalmente expedido o se trata de documento apócrifo.",
      
      desarrollo_1: "1. En primera instancia, procedimos a realizar todas las gestiones a nuestro alcance para localizar y entrar en contacto directo con la persona física o moral a quien se le imputa la autoría del documento cuestionado; sin embargo, a pesar de haber realizado una búsqueda y rastreo exhaustivos mediante los datos que aparecen en el documento, en diferentes pórtales de internet y las bases de datos a las cuales tenemos acceso, NO obtuvimos información útil que nos permitiera contactar al emisor del documento; las anteriores acciones fueron complementadas con una visita al domicilio del supuesto emisor, de la que obtuvimos como resultado que NO corresponde al que actualmente ocupa.",
      
      resumen_1: "En resumen y por lo que corresponde a la primera fase de investigación que consistió en localizar y entrar en contacto con la persona física o moral a quien se le imputa la autoría del documento, NO obtuvimos datos de utilidad y en consecuencia la verificación directa con el emisor no fue posible realizarla por causas ajenas a nuestras actividades de investigación.",
      
      desarrollo_2_inicio: "2. Ante la imposibilidad de obtener datos provenientes del emisor del documento, procedimos a verificar si el comprobante fiscal cuestionado se encontraba dado de alta en los registros del Servicio de administración tributaria, a través de una consulta realizada en el portal de servicios digitales que esta institución pone a disposición de la ciudadanía en la siguiente liga:",
      
      url_sat: "https://www.consulta.sat.gob.mx/SICOFI_WEB/ModuloSituacionFiscal/VerificacionComprobantes.asp",
      
      validez_info: "La validez de la información obtenida a través de la consulta realizada en el portal consultado no es cuestionable, al tratarse de información extraída de un sitio WEB oficial (portal), del que previamente se validó su origen y autenticidad, mediante la obtención de un oficio de fecha 17 de Diciembre de 2025, signado por el Administrador de Coordinación de Servicios Tecnológicos y Enlace Suplente de Transparencia de la Administración General de Comunicaciones y Tecnologías de la Información del Servicio de Administración Tributaria, en el que en contestación a una petición de entrega de información pública nos indica lo siguiente:",
      
      cita_oficial: ""la Administración General de Comunicaciones y Tecnologías de la Información (AGCTI), por conducto de la Administración de Coordinación de Servicios Tecnológicos adscrita a la Administración Central de Planeación y Programación Informática, de conformidad con lo establecido en los artículos 42 y 43 del Reglamento Interior del Servicio de Administración Tributaria (RISAT), le informa que el portal "Verificación de comprobantes fiscales digitales por Internet" que se encuentra en la dirección electrónica https://verificacfdi.facturaelectronica.sat.gob.mx/ es un portal oficial creado por el Servicio de Administración Tributaria (SAT)." (SIC).",
      
      imagen_oficio: "La imagen digitalizada del oficio al que nos acabamos de referir se encuentra agregada al apéndice del documental de este informe.",
      
      verificacion_titulo: "Verificación de los datos que conforman la versión impresa del CFDI.",
      
      verificacion_intro: "En este apartado, realizamos un análisis de los datos que aparecen en la versión impresa del CFDI, para verificar si existen anomalías que nos hagan suponer que el siguiente documento fue alterado o modificado."
    };

    // GENERAR DOCUMENTO
    console.log("📝 Generando documento Word...");
    
    const doc = new Document({
      sections: [
        // ==================== PÁGINA 1: COMPLETA ====================
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
          },
          children: [
            // Header con logo
            ...createHeader(),

            // Referencia (alineada a la derecha)
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

            // FACTURA CFDI PARTE 1 (EN PÁGINA 1)
            ...(facturaImagenes[0] ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: facturaImagenes[0],
                    transformation: { width: 500, height: 350 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
                spacing: { before: 200, after: 200 },
              })
            ] : []),

            // FACTURA CFDI PARTE 2 (EN PÁGINA 1)
            ...(facturaImagenes[1] ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: facturaImagenes[1],
                    transformation: { width: 500, height: 350 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
                spacing: { after: 300 },
              })
            ] : []),

            // Espaciado
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            // HIPÓTESIS (TEXTO FIJO)
            new Paragraph({
              children: [
                new TextRun({ text: "HIPÓTESIS: ", bold: true, font: "Times New Roman", size: 22 }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: TEXTOS_FIJOS.hipotesis,
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

            // DESARROLLO PUNTO 1 (TEXTO FIJO)
            new Paragraph({
              children: [
                new TextRun({ text: "1. ", bold: true, font: "Times New Roman", size: 22 }),
                new TextRun({ 
                  text: TEXTOS_FIJOS.desarrollo_1.substring(3), // Quitar el "1. " inicial
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            // SI HAY RESPUESTA DEL EMISOR: Insertar respuesta + imagen
            ...(analisisIA.tiene_respuesta_emisor && analisisIA.respuesta_emisor ? [
              // Respuesta del emisor (entre comillas)
              new Paragraph({
                children: [
                  new TextRun({
                    text: `"${analisisIA.respuesta_emisor}" (SIC).`,
                    font: "Times New Roman",
                    size: 22,
                  }),
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 300 },
              }),

              // Imagen del correo (3ra imagen)
              ...(facturaImagenes[2] ? [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: facturaImagenes[2],
                      transformation: { width: 450, height: 300 },
                    }),
                  ],
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  },
                  spacing: { before: 200, after: 300 },
                })
              ] : []),

              // Resumen personalizado cuando SÍ hay respuesta
              new Paragraph({
                text: `En resumen y por lo que corresponde a la primera fase de investigación, la factura con folio ${analisisIA.folio_fiscal || "[folio]"}, presuntamente emitida por ${analisisIA.emisor_nombre || "[emisor]"} el ${analisisIA.fecha_emision || "[fecha]"}, NO pudo ser confirmada por la administración actual de dicha empresa. La respuesta recibida no acredita la autenticidad del CFDI ni descarta la posibilidad de que se trate de un documento apócrifo.`,
                alignment: AlignmentType.JUSTIFIED,
                font: "Times New Roman",
                size: 22,
                spacing: { after: 300 },
              }),
            ] : [
              // SI NO HAY RESPUESTA: Solo el resumen estándar
              new Paragraph({
                text: TEXTOS_FIJOS.resumen_1,
                alignment: AlignmentType.JUSTIFIED,
                font: "Times New Roman",
                size: 22,
                spacing: { after: 300 },
              }),
            ]),

            // DESARROLLO PUNTO 2 (TEXTO FIJO)
            new Paragraph({
              children: [
                new TextRun({ text: "2. ", bold: true, font: "Times New Roman", size: 22 }),
                new TextRun({ 
                  text: TEXTOS_FIJOS.desarrollo_2_inicio.substring(4), // Quitar el "2.  " inicial
                  font: "Times New Roman", 
                  size: 22 
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            // RECUADRO CON URL DEL SAT
            new Paragraph({
              children: [
                new TextRun({
                  text: "Verificación de comprobante fiscal en el portal:",
                  font: "Times New Roman",
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              shading: { fill: "CCCCCC" },
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: TEXTOS_FIJOS.url_sat,
                  font: "Times New Roman",
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { after: 300 },
            }),

            // Resultado de la consulta
            new Paragraph({
              text: `Como resultado de la consulta, obtuvimos como resultado que el Comprobante fiscal ${analisisIA.folio_fiscal || "---"} se encuentra registrado en sus bases de datos; al analizar los datos que aparecen en el portal después de realizar la consulta, observando también que estos --- coinciden con los que aparecen en la versión impresa o PDF del mismo.`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 200 },
            }),

            new Paragraph({
              text: "Captura de pantalla del resultado de la consultada realizada.",
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 200 },
            }),

            // Captura validación SAT (imagen 3 si NO hay correo, imagen 4 si SÍ hay correo)
            ...(() => {
              const indexCapturaSAT = analisisIA.tiene_respuesta_emisor ? 3 : 2;
              if (facturaImagenes[indexCapturaSAT]) {
                return [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: facturaImagenes[indexCapturaSAT],
                        transformation: { width: 500, height: 350 },
                      }),
                    ],
                    border: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    },
                    spacing: { before: 200, after: 400 },
                  })
                ];
              } else {
                return [
                  new Paragraph({
                    text: "[Captura de validación SAT pendiente]",
                    alignment: AlignmentType.CENTER,
                    font: "Times New Roman",
                    size: 20,
                    italics: true,
                    spacing: { before: 200, after: 400 },
                  })
                ];
              }
            })(),
          ],
        },

        // ==================== PÁGINA 2: VALIDEZ INFORMACIÓN ====================
        {
          children: [
            ...createHeader(),

            // Validez de la información
            new Paragraph({
              text: TEXTOS_FIJOS.validez_info,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 300 },
            }),

            // Cita oficial (con cursivas y negritas)
            new Paragraph({
              children: [
                new TextRun({
                  text: TEXTOS_FIJOS.cita_oficial,
                  font: "Times New Roman",
                  size: 22,
                  italics: true,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),

            // Imagen digitalizada
            new Paragraph({
              text: TEXTOS_FIJOS.imagen_oficio,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 400 },
            }),
          ],
        },

        // ==================== PÁGINAS 3-6: OFICIOS SAT ====================
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

        // ==================== PÁGINA 7: VERIFICACIÓN DE DATOS CFDI ====================
        {
          children: [
            ...createHeader(),

            // Título en recuadro
            new Paragraph({
              children: [
                new TextRun({
                  text: TEXTOS_FIJOS.verificacion_titulo,
                  font: "Times New Roman",
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              shading: { fill: "CCCCCC" },
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { before: 200, after: 300 },
            }),

            // Introducción
            new Paragraph({
              text: TEXTOS_FIJOS.verificacion_intro,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 400 },
            }),

            // Fecha y hora de emisión
            new Paragraph({
              text: "Fecha y hora de emisión en el encabezado:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            // Recorte fecha encabezado
            ...(recortes.fecha_encabezado ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.fecha_encabezado,
                    transformation: { width: 250, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: "Fecha y hora de emisión en la cadena Original de complemento de certificación digital del SAT.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 100 },
            }),

            // Recorte fecha cadena original
            ...(recortes.fecha_cadena_original ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.fecha_cadena_original,
                    transformation: { width: 250, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.fecha || "COINCIDENTE"}.`,
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              bold: true,
              spacing: { after: 400 },
            }),

            // Folio fiscal
            new Paragraph({
              text: "Folio fiscal del encabezado:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            ...(recortes.folio_encabezado ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.folio_encabezado,
                    transformation: { width: 450, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: "Folio fiscal en la cadena Original de complemento de certificación digital del SAT.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 100 },
            }),

            ...(recortes.folio_cadena_original ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.folio_cadena_original,
                    transformation: { width: 450, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.folio || "COINCIDENTE"}.`,
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              bold: true,
              spacing: { after: 400 },
            }),
          ],
        },

        // ==================== PÁGINA 8: SELLO Y CERTIFICADO ====================
        {
          children: [
            ...createHeader(),

            // Sello digital
            new Paragraph({
              text: "Sello digital del CFDI:",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            ...(recortes.sello_cfdi ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.sello_cfdi,
                    transformation: { width: 500, height: 70 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: "Sello digital del CFDI en la cadena Original de complemento de certificación digital del SAT.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 100 },
            }),

            // Sello cadena original (parte 1)
            ...(recortes.sello_cadena_original_parte1 ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.sello_cadena_original_parte1,
                    transformation: { width: 500, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 50 },
              })
            ] : []),

            // Sello cadena original (parte 2 si existe)
            ...(recortes.sello_cadena_original_parte2 ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.sello_cadena_original_parte2,
                    transformation: { width: 500, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 50, after: 100 },
              })
            ] : []),

            // Si no hay recortes de sello
            ...(!recortes.sello_cadena_original_parte1 && !recortes.sello_cadena_original_parte2 ? [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ] : []),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.sello || "COINCIDENTE"}.`,
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              bold: true,
              spacing: { after: 400 },
            }),

            // Número de certificado
            new Paragraph({
              text: "Número de serie del certificado del SAT.",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            ...(recortes.certificado_encabezado ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.certificado_encabezado,
                    transformation: { width: 300, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: "Número de serie del certificado del SAT en la cadena Original de complemento de certificación digital.",
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 100 },
            }),

            ...(recortes.certificado_cadena ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.certificado_cadena,
                    transformation: { width: 300, height: 40 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: `Resultado: ${analisisIA.verificaciones?.certificado || "COINCIDENTE"}.`,
              alignment: AlignmentType.CENTER,
              font: "Times New Roman",
              size: 22,
              bold: true,
              spacing: { after: 400 },
            }),

            // Revisión código QR
            new Paragraph({
              text: "Revisión del código QR.",
              alignment: AlignmentType.JUSTIFIED,
              bold: true,
              font: "Times New Roman",
              size: 22,
              spacing: { before: 200, after: 100 },
            }),

            ...(recortes.codigo_qr ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: recortes.codigo_qr,
                    transformation: { width: 150, height: 150 },
                  }),
                ],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                },
                spacing: { before: 100, after: 100 },
              })
            ] : [
              new Paragraph({
                text: "[Recorte no disponible]",
                alignment: AlignmentType.CENTER,
                font: "Times New Roman",
                size: 18,
                italics: true,
                spacing: { before: 100, after: 100 },
              })
            ]),

            new Paragraph({
              text: `Resultado: Nos conduce al portal oficial del SAT localizable en la liga https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${analisisIA.folio_fiscal || ""}`,
              alignment: AlignmentType.JUSTIFIED,
              font: "Times New Roman",
              size: 22,
              spacing: { after: 400 },
            }),
          ],
        },

        // ==================== PÁGINA 9: CONCLUSIONES ====================
        {
          children: [
            ...createHeader(),

            // Título CONCLUSIÓN en recuadro
            new Paragraph({
              children: [
                new TextRun({
                  text: "CONCLUSIÓN.",
                  font: "Times New Roman",
                  size: 24,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              shading: { fill: "CCCCCC" },
              border: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              spacing: { before: 400, after: 400 },
            }),

            // Conclusión
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
