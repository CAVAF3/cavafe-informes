// api/generar-html-robo.js
// Genera informe HTML para AXA Robo

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { datosCaso, analisisIA } = req.body;
    
    // Generar HTML con el template de AXA Robo
    const html = generarHTMLRobo(datosCaso, analisisIA);
    
    // Enviar HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Informe_AXA_Robo_${datosCaso.no_siniestro || 'XXXX'}.html"`);
    res.send(html);

  } catch (error) {
    console.error('Error generando HTML:', error);
    return res.status(500).json({ error: 'Error al generar HTML', detalle: error.message });
  }
}

function generarHTMLRobo(datosCaso, analisisIA) {
  const alertasHTML = generarAlertasHTML(analisisIA);
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Investigación - AXA Robo</title>
  <style>
    @page { size: letter; margin: 1in; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td, th { border: 1px solid #000; padding: 6px; }
    .header-table { background: #1a2a4a; color: #fff; font-weight: bold; text-align: center; }
    .section-title { background: #f0f0f0; font-weight: bold; text-align: center; padding: 8px; }
    .alert-critico { background: #DC143C; color: #fff; padding: 15px; margin: 20px 0; border: 3px solid #000; }
    .alert-alto { background: #FFA500; color: #000; padding: 15px; margin: 20px 0; border: 3px solid #000; }
    .alert-medio { background: #FFD700; color: #000; padding: 15px; margin: 20px 0; border: 3px solid #000; }
    .alert-ninguno { background: #90EE90; color: #000; padding: 15px; margin: 20px 0; border: 2px solid #000; }
    h1 { text-align: center; color: #1a2a4a; }
    h2 { color: #1a2a4a; border-bottom: 2px solid #1a2a4a; padding-bottom: 5px; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>

<h1>INFORME DE INVESTIGACIÓN</h1>
<h2 style="text-align:center; color: #b8963e;">AXA - ROBO POR ASALTO</h2>
<p style="text-align:center;"><strong>CAVAFE</strong> | Fecha del informe: ${new Date().toLocaleDateString('es-MX')}</p>

${alertasHTML}

<div class="page-break"></div>

<table>
  <tr><td class="header-table" colspan="5">DATOS DEL SINIESTRO</td></tr>
  <tr>
    <td><strong>No. de siniestro</strong></td>
    <td>${datosCaso.no_siniestro || ''}</td>
    <td><strong>Fecha del Siniestro</strong></td>
    <td>${datosCaso.fecha_siniestro || ''}</td>
    <td><strong>Fecha del Reporte</strong></td>
  </tr>
</table>

<table>
  <tr>
    <td><strong>No. de Póliza</strong></td>
    <td><strong>Inciso</strong></td>
    <td><strong>Inicio Vigencia</strong></td>
    <td><strong>Término Vigencia</strong></td>
    <td><strong>Suma Asegurada V.C.</strong></td>
  </tr>
  <tr><td colspan="5">&nbsp;</td></tr>
</table>

<table>
  <tr>
    <td colspan="2"><strong>Nombre del Asegurado:</strong></td>
  </tr>
  <tr><td colspan="2">${datosCaso.nombre_asegurado || ''}</td></tr>
  <tr>
    <td colspan="2"><strong>Nombre del Conductor:</strong></td>
  </tr>
  <tr><td colspan="2">${datosCaso.nombre_conductor || ''}</td></tr>
</table>

<table>
  <tr><td class="header-table" colspan="4">DATOS DEL VEHÍCULO</td></tr>
  <tr>
    <td><strong>Marca</strong></td>
    <td><strong>Tipo</strong></td>
    <td><strong>Modelo</strong></td>
    <td><strong>Color</strong></td>
  </tr>
  <tr>
    <td>${datosCaso.marca || ''}</td>
    <td>${datosCaso.submarca || ''}</td>
    <td>${datosCaso.modelo || ''}</td>
    <td>${datosCaso.color || ''}</td>
  </tr>
  <tr>
    <td><strong>No. de serie</strong></td>
    <td><strong>No. de motor</strong></td>
    <td colspan="2"><strong>Placas</strong></td>
  </tr>
  <tr>
    <td>${datosCaso.no_serie || ''}</td>
    <td>&nbsp;</td>
    <td colspan="2">${datosCaso.placas || ''}</td>
  </tr>
</table>

<table>
  <tr><td class="header-table">ASIGNACIÓN DE LA INVESTIGACIÓN</td></tr>
  <tr>
    <td><strong>Investigación solicitada por:</strong> LIC. JOSE MANUEL ORTEGA LORA.</td>
  </tr>
  <tr>
    <td><strong>Investigador asignado:</strong> LIC. MANUEL TORIZ CHAVARRIA.</td>
  </tr>
</table>

<div class="page-break"></div>

<h2>VERIFICACIÓN DE PÓLIZA</h2>
<div>${analisisIA.verificacion_poliza || 'No disponible'}</div>

<div class="page-break"></div>

<h2>PREEXISTENCIA DEL VEHÍCULO</h2>
<div>${analisisIA.preexistencia || 'No disponible'}</div>

<div class="page-break"></div>

<h2>CARPETA DE INVESTIGACIÓN</h2>
<div>${analisisIA.carpeta_investigacion || 'No disponible'}</div>

<div class="page-break"></div>

<h2>LUGAR DE LOS HECHOS</h2>
<div>${analisisIA.lugar_hechos || 'No disponible'}</div>

<div class="page-break"></div>

<h2>ENTREVISTA CON EL ASEGURADO</h2>
<div>${analisisIA.entrevista || 'No disponible'}</div>

<div class="page-break"></div>

<h2>VERIFICACIÓN Y ANÁLISIS</h2>
<div>${analisisIA.verificacion_analisis || 'No disponible'}</div>

<div class="page-break"></div>

<h2>DOCUMENTOS</h2>
<div>${analisisIA.documentos || 'No disponible'}</div>

<div class="page-break"></div>

<h2>CONCLUSIONES</h2>
<div>${analisisIA.conclusiones || 'No disponible'}</div>

</body>
</html>`;
}

function generarAlertasHTML(analisisIA) {
  const alertas = analisisIA.alertas || [];
  const nivel_riesgo = analisisIA.nivel_riesgo || 'NINGUNO';
  const recomendacion = analisisIA.recomendacion || 'REVISAR';
  const confianza = analisisIA.confianza || 0;
  
  if (alertas.length === 0 && nivel_riesgo === 'NINGUNO') {
    return '';
  }
  
  const classMap = {
    'CRITICO': 'alert-critico',
    'ALTO': 'alert-alto',
    'MEDIO': 'alert-medio',
    'BAJO': 'alert-bajo',
    'NINGUNO': 'alert-ninguno'
  };
  
  const emojiMap = {
    'CRITICO': '🔴',
    'ALTO': '🟠',
    'MEDIO': '🟡',
    'BAJO': '🔵',
    'NINGUNO': '🟢'
  };
  
  const alertClass = classMap[nivel_riesgo] || 'alert-medio';
  const emoji = emojiMap[nivel_riesgo] || '⚠️';
  
  let html = `<div class="${alertClass}">
    <h2 style="margin:0 0 10px 0;">${emoji} ANÁLISIS DE RIESGOS - NIVEL: ${nivel_riesgo}</h2>
    <p><strong>Recomendación:</strong> ${recomendacion}</p>
    <p><strong>Nivel de confianza:</strong> ${confianza}%</p>`;
  
  if (alertas.length > 0) {
    html += '<h3>Inconsistencias detectadas:</h3><ul>';
    alertas.forEach(alerta => {
      const alertEmoji = emojiMap[alerta.nivel] || '⚠️';
      html += `<li><strong>${alertEmoji} ${alerta.titulo}</strong><br>${alerta.detalle}<br><em>Impacto: ${alerta.impacto}</em></li>`;
    });
    html += '</ul>';
  }
  
  const docsFaltantes = analisisIA.documentos_faltantes || [];
  if (docsFaltantes.length > 0) {
    html += '<h3>Documentos faltantes:</h3><ul>';
    docsFaltantes.forEach(doc => {
      html += `<li>${doc}</li>`;
    });
    html += '</ul>';
  }
  
  html += '</div>';
  return html;
}
