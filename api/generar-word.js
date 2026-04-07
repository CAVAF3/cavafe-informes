import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { datosCaso, analisisIA, imagenes } = req.body;

    const esColision = datosCaso.tipo.includes('Colisión');

    // Crear tabla de alertas
    const alertasRows = analisisIA && analisisIA.alertas 
      ? analisisIA.alertas.map(alerta => 
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(alerta.titulo || '')] }),
              new TableCell({ children: [new Paragraph(alerta.detalle || '')] })
            ]
          })
        )
      : [];

    const tablAlertas = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ text: 'ALERTA', bold: true })],
              shading: { fill: 'CCCCCC' }
            }),
            new TableCell({ 
              children: [new Paragraph({ text: 'DETALLE', bold: true })],
              shading: { fill: 'CCCCCC' }
            })
          ]
        }),
        ...alertasRows
      ]
    });

    let sections = [];

    if (esColision) {
      // Documento para COLISIÓN con marco teórico
      sections = [
        new Paragraph({
          text: 'INFORME DE INVESTIGACIÓN - COLISIÓN',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({ text: '' }),
        
        // Marco teórico
        new Paragraph({
          text: 'MARCO TEÓRICO',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          text: 'La investigación de siniestros de colisión requiere un análisis exhaustivo de la documentación, verificación de la póliza, evaluación de daños y determinación de causas...',
        }),
        new Paragraph({ text: '' }),

        // Datos del caso
        new Paragraph({
          text: 'DATOS DEL SINIESTRO',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph(`No. Siniestro: ${datosCaso.no_siniestro || '___'}`),
        new Paragraph(`Asegurado: ${datosCaso.nombre_asegurado || '___'}`),
        new Paragraph(`Conductor: ${datosCaso.nombre_conductor || '___'}`),
        new Paragraph(`Vehículo: ${datosCaso.marca || '___'} ${datosCaso.submarca || '___'} ${datosCaso.modelo || '___'}`),
        new Paragraph(`Placas: ${datosCaso.placas || '___'}`),
        new Paragraph(`No. Serie: ${datosCaso.no_serie || '___'}`),
        new Paragraph({ text: '' }),

        // Análisis IA
        new Paragraph({
          text: 'ANÁLISIS DE RIESGO',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph(`Nivel de Riesgo: ${analisisIA?.nivel_riesgo || 'N/A'}`),
        new Paragraph(`Recomendación: ${analisisIA?.recomendacion || 'N/A'}`),
        new Paragraph(`Confianza: ${analisisIA?.confianza || 0}%`),
        new Paragraph({ text: '' }),

        tablAlertas,

        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'CONCLUSIONES',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph('Basado en el análisis realizado...'),
        new Paragraph({ text: '' }),
        new Paragraph(`Elaboró: ${datosCaso.revisor || '___'}`),
      ];
    } else {
      // Documento para ROBO (simplificado - el template HTML ya existe)
      sections = [
        new Paragraph({
          text: 'INFORME DE INVESTIGACIÓN - ROBO',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Fecha: ${new Date().toLocaleDateString('es-MX')}`,
          alignment: AlignmentType.RIGHT
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'DATOS DEL SINIESTRO',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph(`No. Siniestro: ${datosCaso.no_siniestro || '___'}`),
        new Paragraph(`Fecha Siniestro: ${datosCaso.fecha_siniestro || '___'}`),
        new Paragraph(`Hora: ${datosCaso.hora_siniestro || '___'}`),
        new Paragraph(`Asegurado: ${datosCaso.nombre_asegurado || '___'}`),
        new Paragraph(`Vehículo: ${datosCaso.marca || '___'} ${datosCaso.submarca || '___'} ${datosCaso.modelo || '___'}`),
        new Paragraph(`Placas: ${datosCaso.placas || '___'}`),
        new Paragraph(`No. Serie: ${datosCaso.no_serie || '___'}`),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'ANÁLISIS DE RIESGO',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph(`Nivel de Riesgo: ${analisisIA?.nivel_riesgo || 'N/A'}`),
        new Paragraph(`Recomendación: ${analisisIA?.recomendacion || 'N/A'}`),
        new Paragraph({ text: '' }),

        tablAlertas,

        new Paragraph({ text: '' }),
        new Paragraph(`Elaboró: ${datosCaso.revisor || '___'}`),
      ];
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Informe_${datosCaso.empresa}_${datosCaso.no_siniestro}.docx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generando Word:', error);
    res.status(500).json({ error: 'Error generando documento', details: error.message });
  }
}
