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
    console.log("[OK] Iniciando generación");
    
    const { datosCaso, analisisIA, imagenes } = req.body;

    if (!datosCaso || !analisisIA || !imagenes || imagenes.length === 0) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const logoCavafe = fs.readFileSync(path.join(process.cwd(), "public", "assets", "logo-cavafe.png"));
    const firmaManuel = fs.readFileSync(path.join(process.cwd(), "public", "assets", "firma-manuel.png"));

    // Procesar facturas
    const facturas = [];
    for (let i = 0; i < Math.min(2, imagenes.length); i++) {
      if (imagenes[i]?.data) {
        const b64 = imagenes[i].data.includes(',') ? imagenes[i].data.split(',')[1] : imagenes[i].data;
        facturas.push(Buffer.from(b64, 'base64'));
      }
    }

    // Procesar otras imágenes
    const imgs = {};
    if (imagenes[2]?.data) imgs.correo = Buffer.from(imagenes[2].data.split(',')[1] || imagenes[2].data, 'base64');
    if (imagenes[3]?.data) imgs.validacionCFDI = Buffer.from(imagenes[3].data.split(',')[1] || imagenes[3].data, 'base64');
    if (imagenes[4]?.data) imgs.certSAT1 = Buffer.from(imagenes[4].data.split(',')[1] || imagenes[4].data, 'base64');
    if (imagenes[5]?.data) imgs.certSAT2 = Buffer.from(imagenes[5].data.split(',')[1] || imagenes[5].data, 'base64');
    if (imagenes[6]?.data) imgs.certIndiv = Buffer.from(imagenes[6].data.split(',')[1] || imagenes[6].data, 'base64');
    if (imagenes[7]?.data) imgs.validRFC = Buffer.from(imagenes[7].data.split(',')[1] || imagenes[7].data, 'base64');
    if (imagenes[8]?.data) imgs.validRFCCP = Buffer.from(imagenes[8].data.split(',')[1] || imagenes[8].data, 'base64');

    // Generar recortes
    const recortes = {};
    if (analisisIA.coordenadas_recortes && facturas.length > 0) {
      const coords = analisisIA.coordenadas_recortes;
      const recortar = async (nombre, c) => {
        try {
          if (!c?.imagen) return null;
          const idx = c.imagen - 1;
          if (idx >= facturas.length) return null;
          return await sharp(facturas[idx]).extract({
            left: Math.max(0, c.x),
            top: Math.max(0, c.y),
            width: c.width,
            height: c.height
          }).toBuffer();
        } catch (e) {
          return null;
        }
      };
      recortes.fechaEnc = await recortar('fechaEnc', coords.fecha_encabezado);
      recortes.fechaCad = await recortar('fechaCad', coords.fecha_cadena_original);
      recortes.folioEnc = await recortar('folioEnc', coords.folio_encabezado);
      recortes.folioCad = await recortar('folioCad', coords.folio_cadena_original);
      recortes.sello = await recortar('sello', coords.sello_cfdi);
      recortes.selloC1 = await recortar('selloC1', coords.sello_cadena_original_parte1);
      recortes.selloC2 = await recortar('selloC2', coords.sello_cadena_original_parte2);
      recortes.certEnc = await recortar('certEnc', coords.certificado_encabezado);
      recortes.certCad = await recortar('certCad', coords.certificado_cadena);
      recortes.qr = await recortar('qr', coords.codigo_qr);
    }

    const header = () => [
      new Paragraph({
        children: [new ImageRun({ data: logoCavafe, transformation: { width: 200, height: 45 }})],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "INFORME DE INVESTIGACIÓN.", font: "Times New Roman", size: 28, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    ];

    const marco = (data, w, h) => ({
      children: [new ImageRun({ data, transformation: { width: w, height: h }})],
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      },
      spacing: { before: 100, after: 100 },
    });

    const recuadroGris = (txt) => new Paragraph({
      children: [new TextRun({ text: txt, font: "Times New Roman", size: 22, bold: true })],
      alignment: AlignmentType.CENTER,
      shading: { fill: "CCCCCC" },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      },
      spacing: { before: 200, after: 200 },
    });

    const txt = (t, opts = {}) => new Paragraph({
      text: t,
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      font: "Times New Roman",
      size: 22,
      bold: opts.bold || false,
      italics: opts.italics || false,
      spacing: { after: opts.after || 200 },
    });

    const doc = new Document({
      sections: [
        // PÁGINA 1
        {
          children: [
            ...header(),
            txt(`REFERENCIA: ${datosCaso.aseguradora || 'SIN'}. ${datosCaso.no_siniestro || 'N/A'}`, { center: true, bold: true, after: 300 }),
            new Paragraph({
              children: [
                new TextRun({ text: "ANTECEDENTES: ", font: "Times New Roman", size: 22, bold: true }),
                new TextRun({ text: `${datosCaso.aseguradora} compañía de seguros nos solicita realizar la verificación de autenticidad de una factura y/o CFDI emitido el día ${analisisIA.fecha_emision}, por la persona física o moral denominada ${analisisIA.emisor_nombre}, en favor de ${analisisIA.receptor_nombre}; en el texto del documento antes descrito, se pretende acreditar la realización de una operación de compra venta de la unidad automotriz de la Marca ${analisisIA.marca}, modelo ${analisisIA.modelo}, serie ${analisisIA.serie}.`, font: "Times New Roman", size: 22 }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 300 },
            }),
            recuadroGris("Documento cuestionado."),
            new Paragraph(marco(facturas[0], 520, 400)),
            ...(facturas[1] ? [new Paragraph(marco(facturas[1], 520, 400))] : []),
            txt("HIPÓTESIS:", { bold: true, after: 100 }),
            txt("La hipótesis proporciona a la investigación la idea directriz, que debe ser mantenida o rectificada una vez obtenidos los resultados de la misma; al respecto, lo primero que corresponde desarrollar es el planteamiento del problema, para después darle cause sistemático a la investigación y así obtener la confirmación o no del hecho puesto a consideración. En este caso en particular, la principal línea de investigación se encamino a determinar con objetividad, si el documento antes descrito fue legalmente expedido o se trata de documento apócrifo."),
            txt("DESARROLLO DE LA INVESTIGACIÓN:", { bold: true }),
            txt("1. En primera instancia, procedimos a realizar todas las gestiones a nuestro alcance para localizar y entrar en contacto directo con la persona física o moral a quien se le imputa la autoría del documento cuestionado; sin embargo, a pesar de haber realizado una búsqueda y rastreo exhaustivos mediante los datos que aparecen en el documento, en diferentes pórtales de internet y las bases de datos a las cuales tenemos acceso, NO obtuvimos información útil que nos permitiera contactar al emisor del documento; las anteriores acciones fueron complementadas con una visita al domicilio del supuesto emisor, de la que obtuvimos como resultado que NO corresponde al que actualmente ocupa."),
            ...(imgs.correo ? [new Paragraph(marco(imgs.correo, 500, 350))] : []),
            txt(analisisIA.respuesta_emisor ? `En resumen, la factura fue confirmada por la administración actual mediante la respuesta recibida.` : "En resumen y por lo que corresponde a la primera fase de investigación que consistió en localizar y entrar en contacto con la persona física o moral a quien se le imputa la autoría del documento, NO obtuvimos datos de utilidad y en consecuencia la verificación directa con el emisor no fue posible realizarla por causas ajenas a nuestras actividades de investigación."),
            txt("2. Ante la imposibilidad de obtener datos provenientes del emisor del documento, procedimos a verificar si el comprobante fiscal cuestionado se encontraba dado de alta en los registros del Servicio de administración tributaria, a través de una consulta realizada en el portal de servicios digitales que esta institución pone a disposición de la ciudadanía en la siguiente liga:"),
            recuadroGris("Verificación de comprobante fiscal en el portal:\nhttps://verificacfdi.facturaelectronica.sat.gob.mx/"),
            txt(`Como resultado de la consulta, obtuvimos como resultado que el Comprobante fiscal ${analisisIA.folio_fiscal} se encuentra registrado en sus bases de datos; al analizar los datos que aparecen en el portal después de realizar la consulta, observamos también que estos SI coinciden con los que aparecen en la versión impresa o PDF del mismo.`),
            txt("Captura de pantalla del resultado de la consultada realizada."),
            ...(imgs.validacionCFDI ? [new Paragraph(marco(imgs.validacionCFDI, 500, 350))] : []),
            txt("La validez de la información obtenida a través de la consulta realizada en el portal consultado no es cuestionable, al tratarse de información extraída de un sitio WEB oficial (portal), del que previamente se validó su origen y autenticidad, mediante la obtención de un oficio de fecha 17 de Diciembre de 2025, signado por el Administrador de Coordinación de Servicios Tecnológicos y Enlace Suplente de Transparencia de la Administración General de Comunicaciones y Tecnologías de la Información del Servicio de Administración Tributaria, en el que en contestación a una petición de entrega de información pública nos indica lo siguiente:"),
            txt("'la Administración General de Comunicaciones y Tecnologías de la Información (AGCTI), por conducto de la Administración de Coordinación de Servicios Tecnológicos adscrita a la Administración Central de Planeación y Programación Informática, de conformidad con lo establecido en los artículos 42 y 43 del Reglamento Interior del Servicio de Administración Tributaria (RISAT), le informa que el portal Verificación de comprobantes fiscales digitales por Internet que se encuentra en la dirección electrónica https://verificacfdi.facturaelectronica.sat.gob.mx/ es un portal oficial creado por el Servicio de Administración Tributaria (SAT).' (SIC).", { italics: true }),
            txt("El oficio del que acabamos de hacer referencia, se encuentra agregado al apéndice del documental de este informe."),
          ],
        },
        
        // PÁGINA: Certificados
        {
          children: [
            ...header(),
            txt("3. Procedimos a verificar si el RFC que aparece en la factura como el del emisor cuenta con Certificados de sello digital o FIEL Firma electrónica Avanzada, así como en qué fecha fueron emitidos y la vigencia con la que contaban, haciéndolo a través de una consulta realizada en el portal de servicios digitales que esta institución pone a disposición de la ciudadanía en la siguiente liga:"),
            recuadroGris("Verificación de comprobante fiscal en el sistema de recuperación de certificados del SAT:\nhttps://portalsat.plataforma.sat.gob.mx/RecuperacionDeCertificados/faces/consultaCertificados.xhtml"),
            txt(`Obtuvimos como resultado, que el Registro Federal de contribuyentes ${analisisIA.emisor_rfc} que aparece en el documento como el del emisor, se encuentra asociado a la persona moral denominada ${analisisIA.emisor_nombre}. A quien le fueron emitidos un total de 16 certificados, de los cuales 8 corresponden a sello digital y 8 corresponden a la Firma electrónica avanzada.`),
            txt("Captura de pantalla del resultado de la consultada realizada."),
            ...(imgs.certSAT1 ? [new Paragraph(marco(imgs.certSAT1, 500, 350))] : []),
            ...(imgs.certSAT2 ? [new Paragraph(marco(imgs.certSAT2, 500, 350))] : []),
            txt(`Imagen del sello digital encontrado, donde se observa que el titular del mismo es ${analisisIA.emisor_nombre}.`),
            ...(imgs.certIndiv ? [new Paragraph(marco(imgs.certIndiv, 400, 300))] : []),
            txt("La validez de la información obtenida a través de la consulta realizada en el portal no es cuestionable, al tratarse de información extraída de un sitio WEB oficial (portal), del que previamente se validó su origen y autenticidad, mediante la obtención de un oficio de fecha 14 de Enero de 2026, signado por el Administrador de Coordinación de Servicios Tecnológicos y Enlace Suplente de Transparencia de la Administración General de Comunicaciones y Tecnologías de la Información del Servicio de Administración Tributaria, en el que en contestación a una petición de entrega de información pública nos indica lo siguiente:"),
            txt("'La Administración General de Comunicaciones y Tecnologías de la Información (AGCTI), por conducto de la Administración de Coordinación de Servicios Tecnológicos adscrita a la Administración Central de Planeación y Programación Informática, de conformidad con lo establecido en los artículos 42 y 43 del Reglamento Interior del Servicio de Administración Tributaria (RISAT), le informa que el portal Sistema de recuperación de certificados que se encuentra en la dirección electrónica https://portalsat.plataforma.sat.gob.mx/RecuperacionDeCertificados/faces/consultaCertificados.xhtml es un portal oficial creado por el Servicio de Administración Tributaria(SAT).' (SIC).", { italics: true }),
            txt("El oficio del que acabamos de hacer referencia, se encuentra agregado al apéndice del documental de este informe."),
          ],
        },

        // PÁGINA: RFC
        {
          children: [
            ...header(),
            txt(`4. Procedimos a verificar si el Registro Federal de contribuyentes ${analisisIA.emisor_rfc} que aparece en el documento como el del emisor, se encuentra asociado a la persona moral denominada ${analisisIA.emisor_nombre}; además, si el código postal número ${analisisIA.codigo_postal || '03920'} está asociado su domicilio fiscal, y si el RFC señalado es válido y susceptible de emitir y recibir documentos fiscales, haciéndolo a través de una consulta realizada en el portal de servicios digitales que esta institución pone a disposición de la ciudadanía en la siguiente liga:`),
            recuadroGris("Verificación de comprobante fiscal en el validador del Registro Federal de Contribuyentes.\nhttps://agsc.siat.sat.gob.mx/PTSC/ValidaRFC/index.jsf"),
            txt(`De acuerdo a los datos proporcionados, obtuvimos como resultado que el Registro Federal de contribuyentes ${analisisIA.emisor_rfc} es válido y susceptible de emitir y recibir comprobantes fiscales.`),
            txt("Captura de pantalla del resultado de la consultada realizada."),
            ...(imgs.validRFC ? [new Paragraph(marco(imgs.validRFC, 500, 280))] : []),
            ...(imgs.validRFCCP ? [new Paragraph(marco(imgs.validRFCCP, 500, 280))] : []),
            txt("La validez de la información obtenida a través de la consulta realizada en el portal no es cuestionable, al tratarse de información extraída de un sitio WEB oficial (portal), del que previamente se validó su origen y autenticidad, mediante la obtención de un oficio de fecha 12 de Enero de 2026, signado por el Administrador de Coordinación de Servicios Tecnológicos y Enlace Suplente de Transparencia de la Administración General de Comunicaciones y Tecnologías de la Información del Servicio de Administración Tributaria, en el que en contestación a una petición de entrega de información pública nos indica lo siguiente:"),
            txt("'La Administración General de Comunicaciones y Tecnologías de la Información (AGCTI), por conducto de la Administración de Coordinación de Servicios Tecnológicos adscrita a la Administración Central de Planeación y Programación Informática, de conformidad con lo establecido en los artículos 42 y 43 del Reglamento Interior del Servicio de Administración Tributaria (RISAT), le informa que el portal Validador de la clave en el RFC que se encuentra en la dirección electrónica https://agsc.siat.sat.gob.mx/PTSC/ValidaRFC/index.jsf es un portal oficial creado por el Servicio de Administración Tributaria.' (SIC).", { italics: true }),
            txt("El oficio del que acabamos de hacer referencia, se encuentra agregado al apéndice del documental de este informe."),
          ],
        },

        // PÁGINA: Verificaciones
        {
          children: [
            ...header(),
            recuadroGris("Verificación de los datos que conforman la versión impresa del CFDI."),
            txt("En este apartado, realizamos un análisis de los datos que aparecen en la versión impresa del CFDI, para verificar si existen anomalías que nos hagan suponer que el siguiente documento fue alterado o modificado."),
            txt("Fecha y hora de emisión en el encabezado:", { bold: true }),
            ...(recortes.fechaEnc ? [new Paragraph(marco(recortes.fechaEnc, 250, 40))] : [txt("[Recorte no disponible]", { center: true })]),
            txt("Fecha y hora de emisión en la cadena Original de complemento de certificación digital del SAT."),
            ...(recortes.fechaCad ? [new Paragraph(marco(recortes.fechaCad, 250, 40))] : [txt("[Recorte no disponible]", { center: true })]),
            txt(`Resultado: ${analisisIA.verificaciones?.fecha || "COINCIDENTE"}.`, { center: true, bold: true, after: 400 }),
            txt("Folio fiscal del encabezado:", { bold: true }),
            ...(recortes.folioEnc ? [new Paragraph(marco(recortes.folioEnc, 450, 40))] : [txt("[Recorte no disponible]", { center: true })]),
            txt("Folio fiscal en la cadena Original de complemento de certificación digital del SAT."),
            ...(recortes.folioCad ? [new Paragraph(marco(recortes.folioCad, 450, 40))] : [txt("[Recorte no disponible]", { center: true })]),
            txt(`Resultado: ${analisisIA.verificaciones?.folio || "COINCIDENTE"}.`, { center: true, bold: true, after: 400 }),
            txt("Sello digital del CFDI:", { bold: true }),
            ...(recortes.sello ? [new Paragraph(marco(recortes.sello, 500, 70))] : [txt("[Recorte no disponible]", { center: true })]),
            txt("Sello digital del CFDI en la cadena Original de complemento de certificación digital del SAT."),
            ...(recortes.selloC1 ? [new Paragraph(marco(recortes.selloC1, 500, 40))] : []),
            ...(recortes.selloC2 ? [new Paragraph(marco(recortes.selloC2, 500, 40))] : []),
            ...(!recortes.selloC1 && !recortes.selloC2 ? [txt("[Recorte no disponible]", { center: true })] : []),
            txt(`Resultado: ${analisisIA.verificaciones?.sello || "COINCIDENTE"}.`, { center: true, bold: true, after: 400 }),
            txt("Número de serie del certificado del SAT.", { bold: true }),
            ...(recortes.certEnc ? [new Paragraph(marco(recortes.certEnc, 300, 40))] : [txt("[Recorte no disponible]", { center: true })]),
            txt("Número de serie del certificado del SAT en la cadena Original de complemento de certificación digital."),
            ...(recortes.certCad ? [new Paragraph(marco(recortes.certCad, 300, 40))] : [txt("[Recorte no disponible]", { center: true })]),
            txt(`Resultado: ${analisisIA.verificaciones?.certificado || "COINCIDENTE"}.`, { center: true, bold: true, after: 400 }),
            txt("Revisión del código QR.", { bold: true }),
            ...(recortes.qr ? [new Paragraph(marco(recortes.qr, 150, 150))] : [txt("[Recorte no disponible]", { center: true })]),
            txt(`Resultado: Nos conduce al portal oficial del SAT localizable en la liga https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${analisisIA.folio_fiscal}`),
          ],
        },

        // PÁGINA: Conclusión
        {
          children: [
            ...header(),
            recuadroGris("CONCLUSIÓN."),
            new Paragraph({
              children: [
                new TextRun({ text: "ÚNICA: ", font: "Times New Roman", size: 22, bold: true }),
                new TextRun({ text: analisisIA.conclusion === 'autentico' ? "De acuerdo a la investigación realizada en este siniestro, NO encontramos elementos que desvirtúen la autenticidad del documento sometido a revisión." : "De acuerdo a la investigación realizada en este siniestro, encontramos elementos que desvirtúen la autenticidad del documento sometido a revisión.", font: "Times New Roman", size: 22 }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 800 },
            }),
            new Paragraph({
              children: [new ImageRun({ data: firmaManuel, transformation: { width: 200, height: 60 }})],
              alignment: AlignmentType.CENTER,
              spacing: { before: 1200, after: 100 },
            }),
            txt("________________________________________", { center: true, after: 200 }),
            txt(datosCaso.revisor || "LIC. MANUEL TORIZ CHAVARRÍA", { center: true, bold: true }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="Informe_${datosCaso.no_siniestro}.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error("[ERROR]:", error);
    res.status(500).json({ error: "Error generando Word", message: error.message });
  }
}
