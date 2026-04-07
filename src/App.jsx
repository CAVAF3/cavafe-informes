import { useState, useRef, useEffect } from "react";

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
const DOCS_P = ["Póliza","Denuncia","Acreditación de Propiedad","Sitio (Lugar de hechos)","Entrevista NA","Entrevista Conductor","Entrevista Testigo","Tenencia","REPUVE","Fotomultas","Concurrencia","CSF","Factura","Verificación de Factura","TAR","INE","Preexistencia","Correo contestación"];
const DOCS_PLAT = [...DOCS_P,"Perfil Plataforma","Historial Ganancias Plataforma","Perfil Vehículo Plataforma","Historial Viajes Plataforma"];

// ── Componentes ──
function Timer() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s+1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs/60), s = secs%60;
  return <div style={{display:"inline-block",background:"#f0f2f8",borderRadius:10,padding:"8px 20px",fontSize:26,fontWeight:800,color:C.navy,letterSpacing:2,fontFamily:"monospace"}}>{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>;
}

function Btn({ children, onClick, disabled, variant="primary", full }) {
  const [h,setH] = useState(false);
  const v = ({primary:{bg:disabled?"#c5cad4":h?C.navyHover:C.navy,color:"#fff",border:"none"},secondary:{bg:h?"#eef0f6":"#fff",color:C.navy,border:`1.5px solid ${C.navy}`},success:{bg:disabled?"#c5cad4":h?C.greenHover:C.green,color:"#fff",border:"none"}})[variant];
  return <button onClick={disabled?undefined:onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:v.bg,color:v.color,border:v.border,borderRadius:8,fontFamily:"'Segoe UI',sans-serif",fontWeight:700,cursor:disabled?"not-allowed":"pointer",transition:"all 0.18s",width:full?"100%":undefined,padding:"13px 22px",fontSize:14,transform:h&&!disabled?"translateY(-2px)":"none",boxShadow:h&&!disabled?"0 6px 18px rgba(0,0,0,0.15)":"0 2px 6px rgba(0,0,0,0.07)"}}>{children}</button>;
}

function Modal({ title, children }) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:"#fff",borderRadius:14,overflow:"hidden",width:380,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
      <div style={{background:C.navy,padding:"14px 20px"}}><div style={{color:"#fff",fontWeight:800,fontSize:15}}>{title}</div></div>
      <div style={{background:C.gold,height:3}}/><div style={{padding:24}}>{children}</div>
    </div>
  </div>;
}

function SelectCard({ label, selected, onClick }) {
  const [h,setH] = useState(false);
  return <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{border:`2px solid ${selected?C.gold:h?C.navy:C.grayBorder}`,borderRadius:10,padding:"16px 12px",textAlign:"center",cursor:"pointer",background:selected?C.navy:h?"#f0f2f8":"#fff",transition:"all 0.18s",transform:h&&!selected?"translateY(-2px)":"none",boxShadow:selected?"0 6px 18px rgba(26,42,74,0.2)":h?"0 4px 12px rgba(26,42,74,0.08)":"none"}}>
    <div style={{fontWeight:800,fontSize:16,color:selected?"#fff":C.navy}}>{label}</div>
    <div style={{fontSize:11,marginTop:4,color:selected?C.goldLight:C.textLight}}>{selected?"✓ Seleccionado":"Seleccionar"}</div>
  </div>;
}

function RadioRow({ label, selected, onClick }) {
  const [h,setH] = useState(false);
  return <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{border:`2px solid ${selected?C.navy:h?"#9aa8c4":C.grayBorder}`,borderRadius:9,padding:"12px 18px",cursor:"pointer",background:selected?"#f0f2f8":h?"#f8f9fc":"#fff",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s",transform:h&&!selected?"translateX(3px)":"none"}}>
    <div style={{width:20,height:20,borderRadius:"50%",border:`2.5px solid ${selected?C.navy:C.grayBorder}`,background:selected?C.navy:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {selected&&<div style={{width:8,height:8,background:"#fff",borderRadius:"50%"}}/>}
    </div>
    <span style={{fontWeight:selected?700:500,fontSize:14,color:C.navy}}>{label}</span>
  </div>;
}

function RevisorRow({ label, selected, onClick }) {
  const [h,setH] = useState(false);
  return <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{border:`2px solid ${selected?C.gold:h?"#c9a84c":C.grayBorder}`,borderRadius:9,padding:"12px 18px",cursor:"pointer",background:selected?"#fffbf0":h?"#fdf8ee":"#fff",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"}}>
    <div style={{width:20,height:20,borderRadius:"50%",border:`2.5px solid ${selected?C.gold:C.grayBorder}`,background:selected?C.gold:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {selected&&<div style={{width:8,height:8,background:"#fff",borderRadius:"50%"}}/>}
    </div>
    <span style={{fontWeight:selected?700:500,fontSize:14,color:C.navy}}>👤 {label}</span>
  </div>;
}

function FInput({ label, value, onChange, placeholder, locked, lockedText, type="text" }) {
  const [f,setF] = useState(false);
  if (locked) return <div><div style={{fontSize:12,color:C.textLight,marginBottom:4,fontWeight:600}}>{label}</div><div style={{padding:"10px 12px",borderRadius:7,border:`1.5px solid ${C.grayBorder}`,background:C.gray,color:C.textLight,fontSize:14}}>🔒 {lockedText}</div></div>;
  return <div>
    <div style={{fontSize:12,color:f?C.navy:C.textLight,marginBottom:4,fontWeight:600}}>{label}</div>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:"100%",padding:"10px 12px",borderRadius:7,border:`1.5px solid ${f?C.navy:C.grayBorder}`,fontSize:14,boxSizing:"border-box",outline:"none",color:C.text,background:"#fff",fontFamily:"'Segoe UI',sans-serif",boxShadow:f?"0 0 0 3px rgba(26,42,74,0.08)":"none"}}/>
  </div>;
}

function StepBar({ current }) {
  const steps = ["Tipo","Datos","Documentos","Informe"];
  return <div style={{display:"flex",alignItems:"center",padding:"14px 28px",background:"#f8f9fc",borderBottom:`1px solid ${C.grayBorder}`}}>
    {steps.map((s,i)=>{
      const done=i<current,active=i===current;
      return <div key={s} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:undefined}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,background:done?C.gold:active?C.navy:C.grayBorder,color:done||active?"#fff":C.textLight}}>{done?"✓":i+1}</div>
          <span style={{fontSize:13,fontWeight:active?700:500,color:active?C.navy:done?C.gold:C.textLight}}>{s}</span>
        </div>
        {i<steps.length-1&&<div style={{flex:1,height:2,background:done?C.gold:C.grayBorder,margin:"0 10px"}}/>}
      </div>;
    })}
  </div>;
}

function Header({ subtitle, onMenu }) {
  const [h,setH] = useState(false);
  return <div style={{background:C.navy,padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:18}}>
      <span style={{color:"#fff",fontSize:26,fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:5}}>CAVAFE</span>
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="white" strokeWidth="2.2"/><ellipse cx="14" cy="14" rx="6" ry="11" stroke="white" strokeWidth="1.4" transform="rotate(-15 14 14)"/></svg>
      <div style={{width:1,height:32,background:"rgba(255,255,255,0.2)"}}/>
      <div>
        <div style={{color:"#fff",fontSize:13,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Sistema de Investigación de Siniestros</div>
        {subtitle&&<div style={{color:C.goldLight,fontSize:12,marginTop:2}}>{subtitle}</div>}
      </div>
    </div>
    {onMenu&&<div onClick={onMenu} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:h?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"8px 14px",cursor:"pointer",color:"#fff",fontSize:22}}>☰</div>}
  </div>;
}

function Card({ children }) {
  return <div style={{background:"#fff",border:`1px solid ${C.grayBorder}`,borderRadius:12,padding:24,boxShadow:"0 2px 14px rgba(0,0,0,0.05)",marginBottom:16}}>{children}</div>;
}

function SecTitle({ n, t }) {
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,paddingBottom:12,borderBottom:`2px solid ${C.grayBorder}`}}>
    <div style={{background:C.navy,color:"#fff",borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{n}</div>
    <div style={{fontWeight:800,fontSize:14,color:C.navy,letterSpacing:0.5,textTransform:"uppercase"}}>{t}</div>
  </div>;
}

export default function App() {
  const [view, setView] = useState("app");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [task, setTask] = useState("");

  const [empresa, setEmpresa] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [revisor, setRevisor] = useState("");

  const [info, setInfo] = useState({
    no_poliza:"", inciso:"", inicio_vigencia:"", termino_vigencia:"",
    nombre_asegurado:"", nombre_conductor:"", no_siniestro:"",
    fecha_siniestro:"", fecha_reporte:"", hora_siniestro:"",
    marca:"", submarca:"", modelo:"", color:"", no_serie:"", placas:"", uso:"Particular",
    fecha_asignacion:"", fecha_entrega:""
  });

  const [images, setImages] = useState([]);
  const [missing, setMissing] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [analisisIA, setAnalisisIA] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdErr, setPwdErr] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [bitacora, setBitacora] = useState([]);

  const fileRef = useRef(null);

  const reset = () => {
    setStep(0); setProgress(0); setEmpresa(""); setTipo(""); setCategoria(""); setRevisor("");
    setInfo({no_poliza:"",inciso:"",inicio_vigencia:"",termino_vigencia:"",nombre_asegurado:"",nombre_conductor:"",no_siniestro:"",fecha_siniestro:"",fecha_reporte:"",hora_siniestro:"",marca:"",submarca:"",modelo:"",color:"",no_serie:"",placas:"",uso:"Particular",fecha_asignacion:"",fecha_entrega:""});
    setImages([]); setMissing([]); setAnalisisIA(null);
  };

  const docsReq = tipo.includes("Plataforma") ? DOCS_PLAT : DOCS_P;

  const checkMissing = (imgs) => {
    const loaded = imgs.map(i => i.category);
    setMissing(docsReq.filter(d => !loaded.includes(d)));
  };

  const processImageWithBorder = (base64Image) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const borderWidth = 2;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width, height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        canvas.width = width + (borderWidth * 2);
        canvas.height = height + (borderWidth * 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, borderWidth, borderWidth, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = base64Image;
    });
  };

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    const processed = await Promise.all(arr.map(async (file) => {
      const base64 = await new Promise((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result.split(',')[1]);
        r.readAsDataURL(file);
      });
      let finalData = base64, url = `data:${file.type};base64,${base64}`;
      if (file.type.startsWith('image/')) {
        try {
          const bordered = await processImageWithBorder(`data:${file.type};base64,${base64}`);
          finalData = bordered.split(',')[1];
          url = bordered;
        } catch (err) {
          console.warn('Error procesando imagen:', err);
        }
      }
      return { name: file.name, type: file.type, data: finalData, url, category: docsReq[0] || "Documento" };
    }));
    const updated = [...images, ...processed];
    setImages(updated);
    checkMissing(updated);
  };

  const rename = (img) => img.name.length > 25 ? img.name.slice(0,22)+"..." : img.name;

  const saveBitacora = async (noSiniestro) => {
    const entry = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString("es-MX"),
      empresa, tipo, categoria,
      no_siniestro: noSiniestro || "S/N",
      revisor
    };
    const updated = [entry, ...bitacora];
    setBitacora(updated);
    try {
      localStorage.setItem("cavafe_bitacora", JSON.stringify(updated));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage");
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cavafe_bitacora");
      if (saved) setBitacora(JSON.parse(saved));
    } catch (e) {
      console.warn("No se pudo cargar bitácora");
    }
  }, []);

  // ── FUNCIÓN PRINCIPAL: Análisis con IA y generación de Word ──
  const doAnalysis = async () => {
    setStep(3);
    setProgress(10);
    setTask("Analizando documentos con IA...");

    try {
      // 1. Llamar a la API de Anthropic para analizar documentos
      const analyzeResponse = await fetch('/api/analizar-documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(img => ({ data: img.data, type: img.type, category: img.category })),
          datosCaso: {
            empresa,
            tipo: `${tipo} - ${categoria}`,
            no_siniestro: info.no_siniestro,
            nombre_asegurado: info.nombre_asegurado,
            nombre_conductor: info.nombre_conductor,
            marca: info.marca,
            submarca: info.submarca,
            modelo: info.modelo,
            color: info.color,
            no_serie: info.no_serie,
            placas: info.placas,
            uso: info.uso
          }
        })
      });

      if (!analyzeResponse.ok) throw new Error('Error en análisis IA');

      const analyzeData = await analyzeResponse.json();
      setAnalisisIA(analyzeData.analisis);

      setProgress(50);
      setTask("Generando documento Word...");

      // 2. Llamar a la API para generar el Word
      const wordResponse = await fetch('/api/generar-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datosCaso: {
            empresa,
            tipo: `${tipo} - ${categoria}`,
            ...info,
            revisor
          },
          analisisIA: analyzeData.analisis,
          imagenes: images.map(img => ({ data: img.data, type: img.type }))
        })
      });

      if (!wordResponse.ok) throw new Error('Error generando Word');

      setProgress(80);
      setTask("Guardando en bitácora...");

      // 3. Guardar en bitácora
      await saveBitacora(info.no_siniestro);

      setProgress(90);
      setTask("Descargando documento...");

      // 4. Descargar el archivo
      const blob = await wordResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_${empresa}_${tipo}_${info.no_siniestro || 'SN'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setProgress(100);
      await new Promise(r => setTimeout(r, 500));
      setStep(4);

    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
      setStep(2);
    }
  };

  const analyze = () => {
    if (images.length===0) {
      setConfirm({msg:"No has subido documentos. El informe se generará con los datos del caso. ¿Continuar?", fn:doAnalysis});
    } else if (missing.length>0) {
      setConfirm({msg:`Faltan ${missing.length} documento(s): ${missing.join(", ")}. ¿Continuar de todas formas?`, fn:doAnalysis});
    } else {
      doAnalysis();
    }
  };

  const s = {fontFamily:"'Segoe UI',sans-serif",maxWidth:920,margin:"0 auto",padding:20};
  const TB = (subtitle, showStep=true) => (
    <div style={{boxShadow:"0 4px 24px rgba(26,42,74,0.14)",borderRadius:12,overflow:"hidden",marginBottom:16}}>
      <Header subtitle={subtitle} onMenu={()=>setMenuOpen(true)}/>
      <div style={{background:C.gold,height:3}}/>
      {showStep&&step<4&&<StepBar current={step}/>}
    </div>
  );

  return (
    <div style={s}>
      {menuOpen&&(
        <>
          <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100}}/>
          <div style={{position:"fixed",top:0,right:0,height:"100%",width:260,background:"#fff",zIndex:101,boxShadow:"-4px 0 24px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column"}}>
            <div style={{background:C.navy,padding:"20px 20px 16px"}}>
              <div style={{color:"#fff",fontWeight:800,fontSize:16}}>CAVAFE</div>
              <div style={{color:C.goldLight,fontSize:12,marginTop:2}}>Menú principal</div>
            </div>
            <div style={{background:C.gold,height:3}}/>
            <div style={{padding:16,flex:1,display:"flex",flexDirection:"column",gap:8}}>
              <div onClick={()=>{setMenuOpen(false);reset();setView("app");}} style={{padding:"13px 14px",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:C.gray}}>
                <span style={{fontSize:20}}>📋</span><span style={{fontWeight:600,fontSize:14,color:C.navy}}>Nuevo caso</span>
              </div>
              <div onClick={()=>{setMenuOpen(false);setPwd("");setPwdErr(false);setShowPwd(true);}} style={{padding:"13px 14px",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:C.gray}}>
                <span style={{fontSize:20}}>🔐</span><span style={{fontWeight:600,fontSize:14,color:C.navy}}>Bitácora</span>
              </div>
            </div>
            <div style={{padding:14,borderTop:`1px solid ${C.grayBorder}`,fontSize:11,color:C.textLight,textAlign:"center"}}>CAVAFE · Documento Confidencial</div>
          </div>
        </>
      )}

      {showPwd&&(
        <Modal title="🔐 Acceso a Bitácora">
          <p style={{fontSize:13,color:C.textLight,marginBottom:6,fontWeight:600}}>Área restringida — solo administrador</p>
          <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr(false);}} onKeyDown={e=>{if(e.key==="Enter"){if(pwd===PASSWORD){setShowPwd(false);setView("bitacora");}else setPwdErr(true);}}} placeholder="Ingresa la contraseña" autoFocus style={{width:"100%",padding:"10px 12px",borderRadius:7,border:`1.5px solid ${pwdErr?"#c62828":C.grayBorder}`,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
          {pwdErr&&<div style={{color:"#c62828",fontSize:12,marginTop:6,fontWeight:600}}>❌ Contraseña incorrecta</div>}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>setShowPwd(false)} style={{flex:1,padding:"10px",borderRadius:7,border:`1.5px solid ${C.grayBorder}`,background:"#fff",color:C.navy,fontWeight:700,cursor:"pointer",fontSize:13}}>Cancelar</button>
            <button onClick={()=>{if(pwd===PASSWORD){setShowPwd(false);setView("bitacora");}else setPwdErr(true);}} style={{flex:1,padding:"10px",borderRadius:7,border:"none",background:C.navy,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Entrar</button>
          </div>
        </Modal>
      )}

      {confirm&&(
        <Modal title="⚠️ Aviso">
          <p style={{fontSize:14,color:C.text,lineHeight:1.6,margin:"0 0 20px"}}>{confirm.msg}</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setConfirm(null)} style={{flex:1,padding:"10px",borderRadius:7,border:`1.5px solid ${C.grayBorder}`,background:"#fff",color:C.navy,fontWeight:700,cursor:"pointer",fontSize:13}}>Cancelar</button>
            <button onClick={()=>{const fn=confirm.fn;setConfirm(null);fn();}} style={{flex:1,padding:"10px",borderRadius:7,border:"none",background:C.navy,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>Continuar</button>
          </div>
        </Modal>
      )}

      {view==="bitacora"&&<>
        {TB("Bitácora de Informes Generados",false)}
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,paddingBottom:12,borderBottom:`2px solid ${C.grayBorder}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{background:C.navy,color:"#fff",borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📋</div>
              <div style={{fontWeight:800,fontSize:14,color:C.navy,textTransform:"uppercase"}}>Historial de Informes</div>
            </div>
            <div style={{background:"#e8eaf6",color:C.navy,borderRadius:20,padding:"4px 12px",fontSize:13,fontWeight:700}}>{bitacora.length} registro(s)</div>
          </div>
          {bitacora.length===0
            ?<div style={{textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div style={{color:C.textLight,fontSize:14,fontWeight:600}}>No hay informes generados aún</div></div>
            :<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {bitacora.map((e,i)=>(
                <div key={e.id} style={{border:`1.5px solid ${C.grayBorder}`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,background:i%2===0?"#fff":"#fafbfc"}}>
                  <div style={{background:C.navy,color:"#fff",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:800,flexShrink:0,minWidth:32,textAlign:"center"}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div><div style={{fontSize:11,color:C.textLight,fontWeight:600}}>EMPRESA · TIPO</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.empresa} · {e.tipo}</div></div>
                    <div style={{marginTop:4}}><div style={{fontSize:11,color:C.textLight,fontWeight:600}}>NO. SINIESTRO</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.no_siniestro}</div></div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.textLight,fontWeight:600}}>FECHA</div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text}}>{e.fecha}</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>
        <Btn variant="secondary" onClick={()=>setView("app")}>← Volver a la aplicación</Btn>
      </>}

      {view==="app"&&<>
        {TB("Generación Automatizada de Informes")}

        {step===0&&<>
          <Card><SecTitle n="1" t="Empresa"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <SelectCard label="AXA" selected={empresa==="AXA"} onClick={()=>{setEmpresa("AXA");setTipo("");setCategoria("");}}/>
              <SelectCard label="QUALITAS" selected={empresa==="QUALITAS"} onClick={()=>{setEmpresa("QUALITAS");setTipo("");setCategoria("");}}/>
            </div>
          </Card>

          {empresa&&<Card><SecTitle n="2" t="Categoría"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
              {Object.keys(ESTRUCTURA[empresa]).map(cat=>
                <RadioRow key={cat} label={cat} selected={tipo===cat} onClick={()=>{setTipo(cat);setCategoria("");}}/>
              )}
            </div>
          </Card>}

          {tipo&&<Card><SecTitle n="3" t="Subtipo"/>
            <div style={{display:"grid",gap:10}}>
              {ESTRUCTURA[empresa][tipo].map(sub=>
                <RadioRow key={sub} label={sub} selected={categoria===sub} onClick={()=>setCategoria(sub)}/>
              )}
            </div>
          </Card>}

          {categoria&&<Card><SecTitle n="4" t="Revisor"/>
            <div style={{display:"grid",gap:10}}>
              {EMPLEADOS.map(emp=>
                <RevisorRow key={emp} label={emp} selected={revisor===emp} onClick={()=>setRevisor(emp)}/>
              )}
            </div>
          </Card>}

          {revisor&&<Btn full onClick={()=>setStep(1)}>Continuar →</Btn>}
        </>}

        {step===1&&<>
          <Card><SecTitle n="1" t="Datos del Caso"/>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
              <FInput label="No. Siniestro" value={info.no_siniestro} onChange={e=>setInfo({...info,no_siniestro:e.target.value})}/>
              <FInput label="Fecha Siniestro" type="date" value={info.fecha_siniestro} onChange={e=>setInfo({...info,fecha_siniestro:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <FInput label="Hora Siniestro" type="time" value={info.hora_siniestro} onChange={e=>setInfo({...info,hora_siniestro:e.target.value})}/>
              <FInput label="Fecha Reporte" type="date" value={info.fecha_reporte} onChange={e=>setInfo({...info,fecha_reporte:e.target.value})}/>
            </div>
            <div style={{marginBottom:12}}>
              <FInput label="No. de Póliza" value={info.no_poliza} onChange={e=>setInfo({...info,no_poliza:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr",gap:12,marginBottom:12}}>
              <FInput label="Inciso" value={info.inciso} onChange={e=>setInfo({...info,inciso:e.target.value})}/>
              <FInput label="Inicio Vigencia" type="date" value={info.inicio_vigencia} onChange={e=>setInfo({...info,inicio_vigencia:e.target.value})}/>
              <FInput label="Término Vigencia" type="date" value={info.termino_vigencia} onChange={e=>setInfo({...info,termino_vigencia:e.target.value})}/>
            </div>
            <div style={{marginBottom:12}}>
              <FInput label="Nombre del Asegurado" value={info.nombre_asegurado} onChange={e=>setInfo({...info,nombre_asegurado:e.target.value})}/>
            </div>
            <div style={{marginBottom:12}}>
              <FInput label="Nombre del Conductor" value={info.nombre_conductor} onChange={e=>setInfo({...info,nombre_conductor:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <FInput label="Marca" value={info.marca} onChange={e=>setInfo({...info,marca:e.target.value})}/>
              <FInput label="Submarca" value={info.submarca} onChange={e=>setInfo({...info,submarca:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <FInput label="Modelo (Año)" value={info.modelo} onChange={e=>setInfo({...info,modelo:e.target.value})}/>
              <FInput label="Color" value={info.color} onChange={e=>setInfo({...info,color:e.target.value})}/>
            </div>
            <div style={{marginBottom:12}}>
              <FInput label="No. Serie (VIN)" value={info.no_serie} onChange={e=>setInfo({...info,no_serie:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FInput label="Placas" value={info.placas} onChange={e=>setInfo({...info,placas:e.target.value})}/>
              <div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:4,fontWeight:600}}>Uso del Vehículo</div>
                <select value={info.uso} onChange={e=>setInfo({...info,uso:e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:7,border:`1.5px solid ${C.grayBorder}`,fontSize:14,boxSizing:"border-box",outline:"none",color:C.text,background:"#fff",fontFamily:"'Segoe UI',sans-serif"}}>
                  <option>Particular</option>
                  <option>Comercial</option>
                  <option>Servicio Público</option>
                  <option>Carga</option>
                </select>
              </div>
            </div>
          </Card>

          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>setStep(0)}>← Atrás</Btn>
            <div style={{flex:1}}><Btn full onClick={()=>setStep(2)}>Continuar →</Btn></div>
          </div>
        </>}

        {step===2&&<>
          <Card><SecTitle n="2" t="Documentos"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:16}}>
              {docsReq.map(doc=>{
                const up=images.find(i=>i.category===doc);
                return <div key={doc} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:7,background:up?"#e8f5e9":"#fff8e1",border:`1.5px solid ${up?"#a5d6a7":"#ffe082"}`}}>
                  <span style={{fontSize:15}}>{up?"✅":"⚠️"}</span>
                  <span style={{fontSize:13,color:up?C.green:"#e65100",fontWeight:600}}>{doc}</span>
                </div>;
              })}
            </div>
            {missing.length>0&&<div style={{background:"#fff3e0",border:"1.5px solid #ffcc02",borderRadius:9,padding:"12px 16px",marginBottom:16,display:"flex",gap:12}}>
              <span style={{fontSize:20}}>⚠️</span>
              <div><div style={{fontWeight:700,color:"#e65100",fontSize:14}}>Faltan {missing.length} documento(s)</div><div style={{fontSize:13,color:"#bf360c",marginTop:3}}>Favor de cargar: <strong>{missing.join(", ")}</strong></div></div>
            </div>}
            <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}} onClick={()=>fileRef.current.click()} style={{border:`2.5px dashed ${dragging?C.navy:C.grayBorder}`,borderRadius:10,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:dragging?"#eef0f9":C.gray,marginBottom:16}}>
              <div style={{fontSize:38,marginBottom:8}}>📂</div>
              <div style={{fontWeight:700,color:C.navy,fontSize:15}}>Arrastra aquí los documentos del caso</div>
              <div style={{fontSize:13,color:C.textLight,marginTop:4}}>Imágenes (JPG, PNG) y documentos Word (DOCX)</div>
              <input ref={fileRef} type="file" multiple accept="image/*,.doc,.docx" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
            </div>
            {images.length>0&&<div>
              <div style={{fontWeight:700,fontSize:13,color:C.textLight,marginBottom:10}}>
                <span style={{background:C.navy,color:"#fff",borderRadius:5,padding:"2px 9px",fontSize:12,marginRight:7}}>{images.length}</span>archivo(s) cargado(s)
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
                {images.map((img,i)=>(
                  <div key={i} style={{background:C.gray,borderRadius:9,padding:8,border:`1px solid ${C.grayBorder}`,position:"relative"}}>
                    {img.url?<img src={img.url} alt="" style={{width:"100%",height:82,objectFit:"cover",borderRadius:6}}/>:<div style={{width:"100%",height:82,background:"#e8eaf6",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>📝</div>}
                    <select value={img.category} onChange={e=>{const u=images.map((x,j)=>j===i?{...x,category:e.target.value}:x);setImages(u);checkMissing(u);}} style={{fontSize:11,padding:"3px 5px",borderRadius:5,border:`1px solid ${C.grayBorder}`,width:"100%",marginTop:6,background:"#fff"}}>
                      {docsReq.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <div style={{fontSize:10,color:C.gold,marginTop:5,wordBreak:"break-all",fontWeight:600,lineHeight:1.3}}>📌 {rename(img)}</div>
                    <button onClick={()=>{const u=images.filter((_,j)=>j!==i);setImages(u);checkMissing(u);}} style={{position:"absolute",top:5,right:5,background:"#ffebee",color:C.red,border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
                  </div>
                ))}
              </div>
            </div>}
          </Card>
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>setStep(1)}>← Atrás</Btn>
            <div style={{flex:1}}><Btn full variant="success" onClick={analyze}>{images.length===0?"Generar Informe sin documentos":`Generar Informe (${images.length} archivo${images.length>1?"s":""})`}</Btn></div>
          </div>
        </>}

        {step===3&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:460}}>
          <div style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 40px rgba(26,42,74,0.18)",maxWidth:460,width:"100%"}}>
            <div style={{background:`linear-gradient(135deg,${C.navy},#2a3f6f)`,padding:"20px 28px",display:"flex",alignItems:"center",gap:14}}>
              <span style={{color:"#fff",fontSize:22,fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:5}}>CAVAFE</span>
            </div>
            <div style={{background:`linear-gradient(90deg,${C.navy},${C.gold})`,height:3}}/>
            <div style={{padding:"44px 36px",textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:24}}>
                {[0,1,2,3,4].map(i=><div key={i} style={{width:14,height:14,borderRadius:"50%",background:i%2===0?C.navy:C.gold,animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite alternate`}}/>)}
              </div>
              <style>{`@keyframes bounce{0%{transform:translateY(0);opacity:0.4}100%{transform:translateY(-20px);opacity:1}}`}</style>
              <div style={{fontSize:20,fontWeight:800,color:C.navy,marginBottom:6}}>Generando tu informe</div>
              <div style={{fontSize:13,color:C.textLight,marginBottom:20,fontStyle:"italic"}}>{task}</div>
              <Timer/>
              <div style={{background:"#eef0f6",borderRadius:999,height:10,overflow:"hidden",margin:"16px 0 8px"}}>
                <div style={{background:`linear-gradient(90deg,${C.navy},${C.gold})`,height:"100%",width:`${progress}%`,transition:"width 0.4s",borderRadius:999}}/>
              </div>
              <div style={{fontSize:12,color:C.textLight}}>{progress}% completado</div>
            </div>
          </div>
        </div>}

        {step===4&&<>
          <Card>
            <div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:60,marginBottom:16}}>✅</div>
              <div style={{fontSize:22,fontWeight:800,color:C.navy,marginBottom:8}}>¡Informe Generado!</div>
              <div style={{fontSize:14,color:C.textLight,marginBottom:24}}>
                El documento Word se descargó automáticamente.
                {analisisIA && analisisIA.alertas && analisisIA.alertas.length > 0 && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 10,
                    background: analisisIA.nivel_riesgo === 'CRÍTICO' ? '#ffebee' :
                               analisisIA.nivel_riesgo === 'ALTO' ? '#fff3e0' :
                               analisisIA.nivel_riesgo === 'MEDIO' ? '#fffde7' : '#e8f5e9',
                    border: `2px solid ${analisisIA.nivel_riesgo === 'CRÍTICO' ? '#c62828' :
                                        analisisIA.nivel_riesgo === 'ALTO' ? '#f57c00' :
                                        analisisIA.nivel_riesgo === 'MEDIO' ? '#fbc02d' : '#388e3c'}`,
                    textAlign: 'left'
                  }}>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>
                      {analisisIA.nivel_riesgo === 'CRÍTICO' ? '🔴' :
                       analisisIA.nivel_riesgo === 'ALTO' ? '🟠' :
                       analisisIA.nivel_riesgo === 'MEDIO' ? '🟡' : '🟢'} 
                      Nivel de Riesgo: {analisisIA.nivel_riesgo}
                    </div>
                    <div style={{fontSize:13,marginBottom:4}}>
                      <strong>Recomendación:</strong> {analisisIA.recomendacion}
                    </div>
                    <div style={{fontSize:13}}>
                      <strong>Confianza:</strong> {analisisIA.confianza}%
                    </div>
                  </div>
                )}
              </div>
              <Btn variant="secondary" onClick={reset}>+ Generar otro informe</Btn>
            </div>
          </Card>
        </>}
      </>}
    </div>
  );
}
