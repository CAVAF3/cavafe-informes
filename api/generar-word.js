// api/generar-word.js
// Genera documentos Word (.docx) para AXA Colisión

import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType, WidthType, ImageRun, BorderStyle, ShadingType } from 'docx';

// Marco teórico de AXA (texto fijo)
const MARCO_TEORICO = {
  metodoDeductivo: {
    titulo: 'MÉTODO DEDUCTIVO:',
    contenido: 'En este método se desciende de lo general a lo particular, de forma que partiendo de enunciados de carácter universal y utilizando instrumentos científicos, se infieren enunciados particulares, pudiendo ser axiomático-deductivo cuando las premisas de partida la constituyen axiomas (proposiciones no demostrables), o hipotético-deductivo si las premisas de partida son hipótesis contrastables.'
  },
  metodoInductivo: {
    titulo: 'MÉTODO INDUCTIVO:',
    contenido: 'El método inductivo es aquel método científico que alcanza conclusiones generales partiendo de hipótesis o antecedentes en particular, por lo tanto se puede decir que asciende de lo particular a lo general.'
  },
  observacionDirecta: {
    titulo: 'OBSERVACIÓN DIRECTA:',
    contenido: 'Es una técnica que consiste en observar atentamente el fenómeno, hecho o caso, tomar información y registrarla para su posterior análisis.'
  },
  metodoCientifico: {
    titulo: 'MÉTODO CIENTÍFICO:',
    contenido: 'El método científico guía y ayuda a comprender cosas desconocidas por medio de la aplicación sistemática de sus pasos fundamentales.'
  },
  principios: {
    titulo: 'PRINCIPIOS',
    items: [
      { num: '1', titulo: 'Principio de intercambio:', desc: 'En la comisión de un delito, el autor deja indicios de su parte y a la vez, arrastra con otros de los hechos.' },
      { num: '2', titulo: 'Principio de correspondencia:', desc: 'Establece la relación de indicios con el autor del hecho.' },
      { num: '3', titulo: 'Principio de reconstrucción:', desc: 'Permite deducir de los indicios recogidos en el lugar de la investigación, la forma en que ocurrió el hecho.' },
      { num: '4', titulo: 'Principio de Probabilidad:', desc: 'Permite deducir la probabilidad o imposibilidad de un fenómeno con base en el número de características verificadas durante un cotejo.' }
    ]
  },
  condicionesPoliza: {
    titulo: 'CONDICIONES GENERALES DE LA PÓLIZA',
    subtitulo: 'Cláusula 12a. Pérdida del Derecho a Ser Indemnizado',
    intro: 'Las obligaciones de la Compañía quedarán extinguidas:',
    items: [
      '1. Si se demuestra que el Asegurado, el Conductor, el Beneficiario o sus Representantes, con el fin de hacer incurrir a la Compañía en error, disimulan o declaran inexactamente hechos que excluirían o podrían restringir dichas obligaciones.',
      '2. Si en el Siniestro hubiere dolo o mala fe del Asegurado, del Conductor, del Beneficiario o de sus respectivos causahabientes.'
    ]
  },
  leyContrato: {
    titulo: 'LEY DEL CONTRATO DEL SEGURO',
    articulo69: 'ARTICULO 69. La empresa aseguradora tendrá el derecho de exigir del asegurado o beneficiario toda clase de informaciones sobre los hechos relacionados con el siniestro y por los cuales puedan determinarse las circunstancias de su realización y las consecuencias del mismo.',
    articulo70: 'ARTICULO 70. Las obligaciones de la empresa quedarán extinguidas si demuestra que el asegurado, el beneficiario o los representantes de ambos, con el fin de hacerla incurrir en error, disimulan o declaran inexactamente hechos que excluirían o podrían restringir dichas obligaciones.'
  },
  codigoPenal: {
    titulo: 'CÓDIGO PENAL',
    articulo: 'Artículo 386.- Comete el delito de fraude el que engañando a uno o aprovechándose del error en que éste se halla se hace ilícitamente de alguna cosa o alcanza un lucro indebido.'
  }
};

function crearMarcoTeorico() {
  const secciones = [];
  
  // Método Deductivo
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.metodoDeductivo.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.metodoDeductivo.contenido })
  );
  
  // Método Inductivo
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.metodoInductivo.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.metodoInductivo.contenido })
  );
  
  // Observación Directa
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.observacionDirecta.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.observacionDirecta.contenido })
  );
  
  // Método Científico
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.metodoCientifico.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.metodoCientifico.contenido })
  );
  
  // Principios
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.principios.titulo, heading: HeadingLevel.HEADING_2 })
  );
  MARCO_TEORICO.principios.items.forEach(item => {
    secciones.push(
      new Paragraph({ text: `${item.num}. ${item.titulo}`, bullet: { level: 0 } }),
      new Paragraph({ text: item.desc })
    );
  });
  
  // Condiciones de Póliza
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.condicionesPoliza.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.condicionesPoliza.subtitulo }),
    new Paragraph({ text: MARCO_TEORICO.condicionesPoliza.intro })
  );
  MARCO_TEORICO.condicionesPoliza.items.forEach(item => {
    secciones.push(new Paragraph({ text: item }));
  });
  
  // Ley del Contrato
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.leyContrato.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.leyContrato.articulo69 }),
    new Paragraph({ text: MARCO_TEORICO.leyContrato.articulo70 })
  );
  
  // Código Penal
  secciones.push(
    new Paragraph({ text: MARCO_TEORICO.codigoPenal.titulo, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: MARCO_TEORICO.codigoPenal.articulo }),
    new Paragraph({ text: '', pageBreakBefore: true }) // Salto de página
  );
  
  return secciones;
}

function crearTablaAlertas(analisisIA) {
  const alertas = analisisIA.alertas || [];
  const nivel_riesgo = analisisIA.nivel_riesgo || 'NINGUNO';
  const recomendacion = analisisIA.recomendacion || 'REVISAR';
  const confianza = analisisIA.confianza || 0;
  
  // Si no hay alertas, no crear tabla
  if (alertas.length === 0 && nivel_riesgo === 'NINGUNO') {
    return null;
  }
  
  // Determinar color de fondo según nivel de riesgo
  const colorConfig = {
    'CRITICO': { bg: 'DC143C', text: 'FFFFFF', emoji: '🔴' }, // Rojo
    'ALTO': { bg: 'FFA500', text: '000000', emoji: '🟠' }, // Naranja
    'MEDIO': { bg: 'FFD700', text: '000000', emoji: '🟡' }, // Amarillo
    'BAJO': { bg: 'ADD8E6', text: '000000', emoji: '🔵' }, // Azul claro
    'NINGUNO': { bg: '90EE90', text: '000000', emoji: '🟢' } // Verde
  };
  
  const config = colorConfig[nivel_riesgo] || colorConfig['MEDIO'];
  
  // Crear tabla principal
  const rows = [];
  
  // Fila de título
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              text: `${config.emoji} ANÁLISIS DE RIESGOS - NIVEL: ${nivel_riesgo}`,
              bold: true,
              size: 28,
              color: config.text
            })
          ],
          shading: { fill: config.bg },
          columnSpan: 2
        })
      ]
    })
  );
  
  // Fila de recomendación
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Recomendación:', bold: true })]
        }),
        new TableCell({
          children: [new Paragraph({
            text: recomendacion,
            bold: true,
            color: recomendacion === 'IMPROCEDENTE' ? 'DC143C' : recomendacion === 'PROCEDENTE' ? '228B22' : 'FFA500'
          })]
        })
      ]
    })
  );
  
  // Fila de confianza
  rows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: 'Nivel de confianza:', bold: true })]
        }),
        new TableCell({
          children: [new Paragraph(`${confianza}%`)]
        })
      ]
    })
  );
  
  // Fila de alertas detectadas
  if (alertas.length > 0) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Inconsistencias detectadas:', bold: true })],
            columnSpan: 2,
            shading: { fill: 'F0F0F0' }
          })
        ]
      })
    );
    
    alertas.forEach((alerta, i) => {
      const alertaEmoji = colorConfig[alerta.nivel]?.emoji || '⚠️';
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: `${alertaEmoji} ${alerta.titulo}`, bold: true }),
                new Paragraph({ text: alerta.detalle }),
                new Paragraph({ text: `Impacto: ${alerta.impacto}`, italics: true })
              ],
              columnSpan: 2
            })
          ]
        })
      );
    });
  }
  
  // Documentos faltantes
  const docsFaltantes = analisisIA.documentos_faltantes || [];
  if (docsFaltantes.length > 0) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Documentos faltantes:', bold: true })],
            columnSpan: 2,
            shading: { fill: 'FFF3CD' }
          })
        ]
      })
    );
    
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(docsFaltantes.map(doc => `• ${doc}`).join('\n'))],
            columnSpan: 2
          })
        ]
      })
    );
  }
  
  const table = new Table({
    rows: rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: 'thick', size: 20, color: '000000' },
      bottom: { style: 'thick', size: 20, color: '000000' },
      left: { style: 'thick', size: 20, color: '000000' },
      right: { style: 'thick', size: 20, color: '000000' }
    }
  });
  
  return table;
}

function crearTablaSiniestro(datosCaso, analisisIA) {
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Tipo de Siniestro:')] }),
          new TableCell({ children: [new Paragraph(analisisIA.descripcion_hechos || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Fecha, Hora y Lugar:')] }),
          new TableCell({ children: [new Paragraph('Fecha, Hora y Lugar:')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Fecha y hora:')] }),
          new TableCell({ children: [new Paragraph(`${datosCaso.fecha_siniestro || ''} a las ${datosCaso.hora_siniestro || ''}`)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Lugar:')] }),
          new TableCell({ children: [new Paragraph(analisisIA.lugar_hechos || '')] })
        ]
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  
  return table;
}

function crearTablaVehiculo(datosCaso) {
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'DATOS DEL VEHÍCULO ASEGURADO.', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'DATOS DEL VEHÍCULO ASEGURADO.', bold: true })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Tipo de bien:')] }),
          new TableCell({ children: [new Paragraph('Vehículo')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Marca:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.marca || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Submarca:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.submarca || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Modelo:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.modelo || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Color:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.color || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Placas:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.placas || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Número de serie:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.no_serie || '')] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Uso:')] }),
          new TableCell({ children: [new Paragraph(datosCaso.uso || 'Particular')] })
        ]
      })
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  
  return table;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { datosCaso, analisisIA, imagenes } = req.body;
    
    // Crear documento
    const children = [
      // Marco teórico
      ...crearMarcoTeorico()
    ];
    
    // ALERTA DE RIESGOS (si hay)
    const tablaAlertas = crearTablaAlertas(analisisIA);
    if (tablaAlertas) {
      children.push(
        new Paragraph({ text: '', pageBreakBefore: true }), // Salto de página después del marco teórico
        tablaAlertas,
        new Paragraph(''), // Espacio
        new Paragraph('') // Espacio
      );
    }
    
    // Resto del documento
    children.push(
      // Datos del siniestro
      crearTablaSiniestro(datosCaso, analisisIA),
      new Paragraph(''),
      
      // Descripción del lugar
      new Paragraph(analisisIA.descripcion_lugar || ''),
      new Paragraph(''),
      
      // Datos del vehículo
      new Paragraph({ text: 'DATOS DEL VEHÍCULO ASEGURADO', heading: HeadingLevel.HEADING_3 }),
      crearTablaVehiculo(datosCaso),
      new Paragraph(''),
      
      // Lista de daños
      new Paragraph({ text: 'IDENTIFICACIÓN DE DAÑOS', heading: HeadingLevel.HEADING_3 }),
      new Paragraph(analisisIA.lista_danos_texto || ''),
      
      // Análisis y conclusiones
      new Paragraph({ text: 'ANÁLISIS TÉCNICO', heading: HeadingLevel.HEADING_2, pageBreakBefore: true }),
      new Paragraph(analisisIA.analisis || ''),
      new Paragraph(''),
      new Paragraph({ text: 'CONCLUSIONES', heading: HeadingLevel.HEADING_2 }),
      new Paragraph(analisisIA.conclusiones || '')
    );
    
    const doc = new Document({
      sections: [{
        children: children
      }]
    });

    // Generar buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Enviar como descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Informe_AXA_Colision_${datosCaso.no_siniestro || 'XXXX'}.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generando Word:', error);
    return res.status(500).json({ error: 'Error al generar documento Word', detalle: error.message });
  }
}
