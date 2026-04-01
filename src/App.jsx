import { useState } from "react";

const C = {
  navy:"#1a2a4a", navyHover:"#243d6b", gold:"#b8963e", goldLight:"#d4aa55",
  gray:"#f4f5f7", grayBorder:"#dde1e9", text:"#1c2333", textLight:"#5a6478",
  green:"#2e7d32", greenHover:"#1b5e20", red:"#c62828"
};

const PASSWORD = "Sise9490";
const EMPLEADOS = ["LIC. MANUEL TORIZ CHAVARRÍA","YADIRA LIRAI REYES RAMOS","VERÓNICA 1","VERÓNICA 2"];
const ESTRUCTURA = {
  AXA: { Robo:["Robo por asalto","Robo Veh. Estacionado","Robo en Plataforma"], Colisión:["Colisión Particular","Colisión Plataforma"] },
  QUALITAS: { Robo:["Robo Particular","Robo Equipo Pesado","Robo Fronterizo","Robo Plataforma"], Colisión:["Colisión Particular"], Facturas:["Con contestación de emisor por correo","Con contestación de emisor por llamada","Con elementos de documento impreso"], Licencia:["Con contestación de emisor"] }
};

function Btn({ children, onClick, disabled, variant="primary", full }) {
  const [h,setH] = useState(false);
  const v = ({
    primary:{bg:disabled?"#c5cad4":h?C.navyHover:C.navy,color:"#fff",border:"none"},
    secondary:{bg:h?"#eef0f6":"#fff",color:C.navy,border:`1.5px solid ${C.navy}`},
    success:{bg:disabled?"#c5cad4":h?C.greenHover:C.green,color:"#fff",border:"none"}
  })[variant];
  
  return (
    <button 
      onClick={disabled?undefined:onClick} 
      disabled={disabled} 
      onMouseEnter={()=>setH(true)} 
      onMouseLeave={()=>setH(false)} 
      style={{
        background:v.bg,
        color:v.color,
        border:v.border,
        borderRadius:8,
        fontFamily:"'Segoe UI',sans-serif",
        fontWeight:700,
        cursor:disabled?"not-allowed":"pointer",
        transition:"all 0.18s",
        width:full?"100%":undefined,
        padding:"13px 22px",
        fontSize:14,
        transform:h&&!disabled?"translateY(-2px)":"none",
        boxShadow:h&&!disabled?"0 6px 18px rgba(0,0,0,0.15)":"0 2px 6px rgba(0,0,0,0.07)"
      }}
    >
      {children}
    </button>
  );
}

function FInput({ label, value, onChange, placeholder, type="text" }) {
  const [f,setF] = useState(false);
  return (
    <div>
      <div style={{fontSize:12,color:f?C.navy:C.textLight,marginBottom:4,fontWeight:600}}>
        {label}
      </div>
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        onFocus={()=>setF(true)} 
        onBlur={()=>setF(false)} 
        style={{
          width:"100%",
          padding:"10px 12px",
          borderRadius:7,
          border:`1.5px solid ${f?C.navy:C.grayBorder}`,
          fontSize:14,
          boxSizing:"border-box",
          outline:"none",
          color:C.text,
          background:"#fff",
          fontFamily:"'Segoe UI',sans-serif",
          boxShadow:f?"0 0 0 3px rgba(26,42,74,0.08)":"none"
        }}
      />
    </div>
  );
}

function SelectCard({ label, selected, onClick }) {
  const [h,setH] = useState(false);
  return (
    <div 
      onClick={onClick} 
      onMouseEnter={()=>setH(true)} 
      onMouseLeave={()=>setH(false)} 
      style={{
        border:`2px solid ${selected?C.gold:h?C.navy:C.grayBorder}`,
        borderRadius:10,
        padding:"16px 12px",
        textAlign:"center",
        cursor:"pointer",
        background:selected?C.navy:h?"#f0f2f8":"#fff",
        transition:"all 0.18s",
        transform:h&&!selected?"translateY(-2px)":"none",
        boxShadow:selected?"0 6px 18px rgba(26,42,74,0.2)":h?"0 4px 12px rgba(26,42,74,0.08)":"none"
      }}
    >
      <div style={{fontWeight:800,fontSize:16,color:selected?"#fff":C.navy}}>{label}</div>
      <div style={{fontSize:11,marginTop:4,color:selected?C.goldLight:C.textLight}}>
        {selected?"✓ Seleccionado":"Seleccionar"}
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [empresa, setEmpresa] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subtipo, setSubtipo] = useState("");
  const [revisor, setRevisor] = useState("");
  
  // Datos del caso
  const [noSiniestro, setNoSiniestro] = useState("");
  const [fechaSiniestro, setFechaSiniestro] = useState("");
  const [horaSiniestro, setHoraSiniestro] = useState(""); // NUEVO
  const [fechaReporte, setFechaReporte] = useState("");
  const [nombreAsegurado, setNombreAsegurado] = useState("");
  const [nombreConductor, setNombreConductor] = useState("");
  const [marca, setMarca] = useState("");
  const [submarca, setSubmarca] = useState(""); // NUEVO
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState(""); // NUEVO
  const [noSerie, setNoSerie] = useState("");
  const [placas, setPlacas] = useState("");
  const [uso, setUso] = useState("Particular"); // NUEVO
  
  // Documentos
  const [documentos, setDocumentos] = useState([]);
  
  // Estado del análisis
  const [analizando, setAnalizando] = useState(false);
  const [analisisCompleto, setAnalisisCompleto] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newDocs = await Promise.all(
      files.map(async (file) => {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const b64 = reader.result.split(',')[1];
            resolve(b64);
          };
          reader.readAsDataURL(file);
        });
        
        // Procesar imagen (marco negro + redimensionar)
        let processedData = base64;
        if (file.type.startsWith('image/')) {
          try {
            processedData = await processImageWithBorder(`data:${file.type};base64,${base64}`);
            // Quitar el prefijo data:image...
            processedData = processedData.split(',')[1];
          } catch (err) {
            console.warn('No se pudo procesar imagen, usando original:', err);
          }
        }
        
        return {
          name: file.name,
          type: file.type,
          data: processedData,
          category: "Documento" // Aquí podrías categorizar automáticamente
        };
      })
    );
    
    setDocumentos([...documentos, ...newDocs]);
  };
  
  // Función auxiliar para procesar imágenes
  const processImageWithBorder = (base64Image) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      
      img.onload = () => {
        // Canvas con marco de 2px
        const borderWidth = 2;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Redimensionar si es muy grande
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width + (borderWidth * 2);
        canvas.height = height + (borderWidth * 2);
        
        // Fondo negro (marco)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Imagen encima
        ctx.drawImage(img, borderWidth, borderWidth, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = base64Image;
    });
  };

  const analizarConIA = async () => {
    setAnalizando(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analizar-documentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: documentos,
          datosCaso: {
            empresa,
            tipo: `${categoria} - ${subtipo}`,
            no_siniestro: noSiniestro,
            nombre_asegurado: nombreAsegurado,
            nombre_conductor: nombreConductor,
            marca,
            submarca,
            modelo,
            color,
            no_serie: noSerie,
            placas,
            uso
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalisisCompleto(data.analisis);
        setStep(3); // Avanzar a la vista del informe
      } else {
        setError(data.error || 'Error al analizar documentos');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setAnalizando(false);
    }
  };

  const generarInforme = async () => {
    try {
      const response = await fetch('/api/generar-html-robo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datosCaso: {
            empresa,
            tipo: `${categoria} - ${subtipo}`,
            no_siniestro: noSiniestro,
            fecha_siniestro: fechaSiniestro,
            nombre_asegurado: nombreAsegurado,
            nombre_conductor: nombreConductor,
            marca,
            submarca,
            modelo,
            color,
            no_serie: noSerie,
            placas,
            uso
          },
          analisisIA: analisisCompleto
        })
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_AXA_Robo_${noSiniestro}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error al descargar HTML: ' + error.message);
    }
  };
  
  const descargarWord = async () => {
    try {
      const response = await fetch('/api/generar-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datosCaso: {
            empresa,
            tipo: `${categoria} - ${subtipo}`,
            no_siniestro: noSiniestro,
            fecha_siniestro: fechaSiniestro,
            hora_siniestro: horaSiniestro,
            nombre_asegurado: nombreAsegurado,
            nombre_conductor: nombreConductor,
            marca,
            submarca,
            modelo,
            color,
            no_serie: noSerie,
            placas,
            uso
          },
          analisisIA: analisisCompleto,
          imagenes: documentos.map(doc => ({ data: doc.data, type: doc.type }))
        })
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_AXA_Colision_${noSiniestro}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error al descargar Word: ' + error.message);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f2f8",fontFamily:"'Segoe UI',sans-serif"}}>
      {/* Header */}
      <div style={{background:C.navy,padding:"16px 28px"}}>
        <span style={{color:"#fff",fontSize:26,fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:5}}>
          CAVAFE
        </span>
      </div>

      {/* Content */}
      <div style={{padding:40,maxWidth:900,margin:"0 auto"}}>
        
        {/* PASO 0: Selección Empresa */}
        {step === 0 && (
          <div>
            <h2 style={{color:C.navy,marginBottom:24}}>Selecciona la Empresa</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
              <SelectCard label="AXA" selected={empresa==="AXA"} onClick={()=>setEmpresa("AXA")} />
              <SelectCard label="QUALITAS" selected={empresa==="QUALITAS"} onClick={()=>setEmpresa("QUALITAS")} />
            </div>
            <Btn onClick={()=>setStep(1)} disabled={!empresa} full>Continuar</Btn>
          </div>
        )}

        {/* PASO 1: Categoría y Subtipo */}
        {step === 1 && (
          <div>
            <h2 style={{color:C.navy,marginBottom:24}}>Categoría y Subtipo</h2>
            
            <div style={{marginBottom:24}}>
              <h3 style={{color:C.navy,fontSize:16,marginBottom:12}}>Categoría:</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:12}}>
                {Object.keys(ESTRUCTURA[empresa] || {}).map(cat => (
                  <SelectCard 
                    key={cat} 
                    label={cat} 
                    selected={categoria===cat} 
                    onClick={()=>{setCategoria(cat);setSubtipo("");}} 
                  />
                ))}
              </div>
            </div>

            {categoria && (
              <div style={{marginBottom:24}}>
                <h3 style={{color:C.navy,fontSize:16,marginBottom:12}}>Subtipo:</h3>
                <div style={{display:"grid",gap:12}}>
                  {ESTRUCTURA[empresa][categoria].map(sub => (
                    <SelectCard 
                      key={sub} 
                      label={sub} 
                      selected={subtipo===sub} 
                      onClick={()=>setSubtipo(sub)} 
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{marginBottom:24}}>
              <h3 style={{color:C.navy,fontSize:16,marginBottom:12}}>Revisor:</h3>
              <div style={{display:"grid",gap:12}}>
                {EMPLEADOS.map(emp => (
                  <SelectCard 
                    key={emp} 
                    label={emp} 
                    selected={revisor===emp} 
                    onClick={()=>setRevisor(emp)} 
                  />
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:12}}>
              <Btn onClick={()=>setStep(0)} variant="secondary">Atrás</Btn>
              <Btn onClick={()=>setStep(2)} disabled={!subtipo || !revisor} full>Continuar</Btn>
            </div>
          </div>
        )}

        {/* PASO 2: Datos y Documentos */}
        {step === 2 && (
          <div>
            <h2 style={{color:C.navy,marginBottom:24}}>Datos del Caso y Documentos</h2>
            
            <div style={{display:"grid",gap:16,marginBottom:32}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
                <FInput label="No. Siniestro" value={noSiniestro} onChange={(e)=>setNoSiniestro(e.target.value)} />
                <FInput label="Fecha Siniestro" type="date" value={fechaSiniestro} onChange={(e)=>setFechaSiniestro(e.target.value)} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <FInput label="Hora del Siniestro" type="time" value={horaSiniestro} onChange={(e)=>setHoraSiniestro(e.target.value)} placeholder="ej: 14:30" />
                <FInput label="Fecha Reporte" type="date" value={fechaReporte} onChange={(e)=>setFechaReporte(e.target.value)} />
              </div>
              <FInput label="Nombre del Asegurado" value={nombreAsegurado} onChange={(e)=>setNombreAsegurado(e.target.value)} />
              <FInput label="Nombre del Conductor" value={nombreConductor} onChange={(e)=>setNombreConductor(e.target.value)} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <FInput label="Marca" value={marca} onChange={(e)=>setMarca(e.target.value)} placeholder="ej: NISSAN" />
                <FInput label="Submarca" value={submarca} onChange={(e)=>setSubmarca(e.target.value)} placeholder="ej: X-TRAIL" />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <FInput label="Modelo (Año)" value={modelo} onChange={(e)=>setModelo(e.target.value)} placeholder="ej: 2021" />
                <FInput label="Color" value={color} onChange={(e)=>setColor(e.target.value)} placeholder="ej: Gris" />
              </div>
              <FInput label="No. Serie (VIN)" value={noSerie} onChange={(e)=>setNoSerie(e.target.value)} placeholder="17 caracteres" />
              <FInput label="Placas" value={placas} onChange={(e)=>setPlacas(e.target.value)} placeholder="ej: ABC1234" />
              <div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:4,fontWeight:600}}>Uso del Vehículo</div>
                <select 
                  value={uso} 
                  onChange={(e)=>setUso(e.target.value)}
                  style={{
                    width:"100%",
                    padding:"10px 12px",
                    borderRadius:7,
                    border:`1.5px solid ${C.grayBorder}`,
                    fontSize:14,
                    boxSizing:"border-box",
                    outline:"none",
                    color:C.text,
                    background:"#fff",
                    fontFamily:"'Segoe UI',sans-serif"
                  }}
                >
                  <option value="Particular">Particular</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Servicio Público">Servicio Público</option>
                  <option value="Carga">Carga</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:24}}>
              <h3 style={{color:C.navy,fontSize:16,marginBottom:12}}>
                Documentos ({documentos.length})
              </h3>
              <input 
                type="file" 
                multiple 
                accept="image/*,application/pdf" 
                onChange={handleFileUpload}
                style={{marginBottom:12}}
              />
              {documentos.length > 0 && (
                <div style={{background:"#fff",borderRadius:8,padding:16,border:`1px solid ${C.grayBorder}`}}>
                  {documentos.map((doc, i) => (
                    <div key={i} style={{padding:"8px 0",borderBottom:i<documentos.length-1?`1px solid ${C.grayBorder}`:"none"}}>
                      📄 {doc.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{background:"#ffebee",color:C.red,padding:16,borderRadius:8,marginBottom:16}}>
                ⚠️ {error}
              </div>
            )}

            <div style={{display:"flex",gap:12}}>
              <Btn onClick={()=>setStep(1)} variant="secondary">Atrás</Btn>
              <Btn 
                onClick={analizarConIA} 
                disabled={analizando || !noSiniestro || documentos.length === 0} 
                variant="success"
                full
              >
                {analizando ? "Analizando con IA... ⏳" : "Analizar y Generar Informe 🤖"}
              </Btn>
            </div>
          </div>
        )}

        {/* PASO 3: Resultado */}
        {step === 3 && analisisCompleto && (
          <div>
            <h2 style={{color:C.navy,marginBottom:24}}>✅ Análisis Completado</h2>
            
            <div style={{background:"#fff",borderRadius:12,padding:24,marginBottom:24,border:`2px solid ${C.gold}`}}>
              <h3 style={{color:C.navy,marginBottom:16}}>Resumen del Análisis:</h3>
              <pre style={{whiteSpace:"pre-wrap",fontSize:13,color:C.text}}>
                {JSON.stringify(analisisCompleto, null, 2)}
              </pre>
            </div>

            {/* Detectar si es Colisión o Robo */}
            {categoria === "Colisión" ? (
              <div style={{display:"grid",gap:12}}>
                <Btn onClick={descargarWord} variant="success" full>
                  📄 Descargar Informe Word (.docx)
                </Btn>
                <div style={{textAlign:"center",fontSize:12,color:C.textLight}}>
                  Informe AXA Colisión con marco teórico completo
                </div>
              </div>
            ) : (
              <div style={{display:"grid",gap:12}}>
                <Btn onClick={generarInforme} variant="success" full>
                  📄 Descargar Informe HTML (10 páginas)
                </Btn>
                <div style={{textAlign:"center",fontSize:12,color:C.textLight}}>
                  Informe AXA Robo formato HTML
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
