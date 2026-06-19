import { useState, useEffect, useCallback } from "react";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function sb(path, method="GET", body=null, prefer="return=representation") {
  const headers = {
    "apikey": SUPA_KEY,
    "Authorization": `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
    "Prefer": prefer,
  };
  const opts = { method, headers };
  if(body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const db = {
  get:    (table, qs="")    => sb(qs ? `${table}?${qs}` : table, "GET"),
  insert: (table, data)     => sb(table, "POST", data),
  update: (table, id, data) => sb(`${table}?id=eq.${id}`, "PATCH", data),
  upsert: (table, data)     => sb(table, "POST", data, "resolution=merge-duplicates,return=representation"),
  delete: (table, id)       => sb(`${table}?id=eq.${id}`, "DELETE", null, ""),
};

// ── WORKERS (Ara amb IDs numèrics per coincidir amb la BBDD) ──────────────────
const WORKERS_DEF = [
  { id:1, nom:"Treballador 1", equip:"fix",   hores:35, rol:"treballador" },
  { id:2, nom:"Treballador 2", equip:"fix",   hores:25, rol:"treballador" },
  { id:3, nom:"Treballador 3", equip:"fix",   hores:25, rol:"treballador" },
  { id:4, nom:"Treballador 4", equip:"fix",   hores:18, rol:"treballador" },
  { id:5, nom:"Treballador 5", equip:"borsa", hores:18, rol:"treballador" },
  { id:6, nom:"Treballador 6", equip:"borsa", hores:0,  rol:"treballador" },
  { id:7, nom:"Treballador 7", equip:"borsa", hores:0,  rol:"treballador" },
  { id:8, nom:"Persona d'oficina", equip:"fix", hores:0, rol:"oficina" },
  { id:9, nom:"Dalsy (Admin)", equip:"fix",   hores:0,  rol:"admin" },
];

// ── DADES INICIALS (Seed - Sense IDs perquè Supabase els generi) ──────────
const INV_INIT = [
  {nom:"Cadira Garrotxa", categoria:"Mobiliari", total:80, disponible:72, estat:"bo", ubicacio:"Magatzem A", notes:"Apilable fins 8 unitats"},
  {nom:"Cadira Garrotxa amb braços", categoria:"Mobiliari", total:20, disponible:18, estat:"bo", ubicacio:"Magatzem A", notes:""},
  {nom:"Cadira plegable", categoria:"Mobiliari", total:50, disponible:44, estat:"bo", ubicacio:"Magatzem A", notes:""},
  {nom:"Tamboret alt", categoria:"Mobiliari", total:12, disponible:10, estat:"bo", ubicacio:"Magatzem A", notes:""},
  {nom:"Taula plegable rectangular", categoria:"Mobiliari", total:20, disponible:16, estat:"bo", ubicacio:"Magatzem A", notes:"180×70 cm"},
  {nom:"Taula plegable rodona", categoria:"Mobiliari", total:8, disponible:7, estat:"bo", ubicacio:"Magatzem A", notes:"Ø 120 cm"},
  {nom:"Carpa lleugera 3×3 m", categoria:"Infraestructura", total:6, disponible:4, estat:"bo", ubicacio:"Magatzem B", notes:"Inclou sacs de sorra"},
  {nom:"Altaveu Behringer", categoria:"Equip de so", total:4, disponible:3, estat:"bo", ubicacio:"Sala tècnica", notes:"Bateria 8h"},
  {nom:"Projector Full HD", categoria:"Equip de llums", total:1, disponible:1, estat:"bo", ubicacio:"Sala tècnica", notes:"HDMI + VGA"},
];

const TORNS_INIT = [
  {worker_id:1, dia:"2026-06-16", hora_entrada:"09:00", hora_sortida:"15:00", servei:"GREC", equip:"fix"},
  {worker_id:1, dia:"2026-06-17", hora_entrada:"10:00", hora_sortida:"12:00", servei:"GREC", equip:"fix"},
  {worker_id:2, dia:"2026-06-16", hora_entrada:"07:00", hora_sortida:"15:00", servei:"GREC", equip:"fix"},
  {worker_id:2, dia:"2026-06-17", hora_entrada:"07:00", hora_sortida:"15:00", servei:"ESPORT3", equip:"fix"},
];

const BKGS_INIT = [
  {entitat:"Ass. Veïns El Raval", inventari_id:1, quantitat:30, data_inici:"2026-06-10", data_fi:"2026-06-11", estat:"confirmada", contacte:"Maria G.", telefon:"600 123 456"},
  {entitat:"Club Esportiu Gòtic", inventari_id:7, quantitat:2, data_inici:"2026-06-14", data_fi:"2026-06-15", estat:"pendent", contacte:"Jordi L.", telefon:"611 234 567"},
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const CATS = ["Totes","Mobiliari","Infraestructura","Equip de so","Equip de llums","Altres"];
const avisColors = {ok:"#16a34a",warn:"#d97706",urgent:"#dc2626",info:"#2563eb"};
const avisLabels = {ok:"Servei completat",warn:"Incidència",urgent:"Urgent",info:"Avís general"};
const pct = (d,t) => t ? Math.round(d/t*100) : 0;
const sColor = (d,t) => { const p=pct(d,t); return p>60?"#16a34a":p>25?"#d97706":"#dc2626"; };

const calcHoresTorn = (t) => {
  if(!t.hora_entrada||!t.hora_sortida) return 0;
  const [eh,em] = t.hora_entrada.split(":").map(Number);
  const [sh,sm] = t.hora_sortida.split(":").map(Number);
  return (sh*60+sm - eh*60-em)/60;
};

function getSetmanaActual() {
  const avui = new Date();
  const dow = avui.getDay();
  const dl = new Date(avui);
  dl.setDate(avui.getDate() - (dow===0?6:dow-1));
  return Array.from({length:5},(_,i)=>{
    const d=new Date(dl); d.setDate(dl.getDate()+i);
    return d.toISOString().split("T")[0];
  });
}

const DIES = ["Dl","Dm","Dx","Dj","Dv"];
const inputSt = {width:"100%",padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,fontFamily:"inherit",color:"#1a1a1a",boxSizing:"border-box"};
const labelSt = {fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",marginBottom:3,display:"block"};

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Badge({estat}){
  const map={bo:{bg:"#dcfce7",c:"#15803d",l:"Bo"},manteniment:{bg:"#fef9c3",c:"#a16207",l:"Manteniment"},baixa:{bg:"#fee2e2",c:"#b91c1c",l:"Baixa"},confirmada:{bg:"#dbeafe",c:"#1d4ed8",l:"Confirmada"},pendent:{bg:"#fef9c3",c:"#a16207",l:"Pendent"},activa:{bg:"#dcfce7",c:"#15803d",l:"Activa"},completada:{bg:"#f3f4f6",c:"#6b7280",l:"Completada"}};
  const s=map[estat]||{bg:"#f3f4f6",c:"#374151",l:estat};
  return <span style={{background:s.bg,color:s.c,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>{s.l}</span>;
}
function Notif({msg,type}){
  return <div style={{position:"fixed",top:74,right:16,zIndex:999,background:type==="ok"?"#15803d":"#dc2626",color:"#fff",padding:"10px 16px",borderRadius:10,fontWeight:600,fontSize:13,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{type==="ok"?"✓ ":"⚠ "}{msg}</div>;
}
function Modal({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:18,padding:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h2 style={{fontSize:17,fontWeight:700,color:"#1a1a1a"}}>{title}</h2>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"none",borderRadius:8,width:30,height:30,fontSize:15,cursor:"pointer",color:"#6b7280"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── WELCOME SCREEN ────────────────────────────────────────────────────────────
function WelcomeScreen({onEnter, customNames}){
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState("pick");
  const [nomInput, setNomInput] = useState("");

  const handlePick = (w) => {
    setSel(w);
    const jaTeNom = !!customNames[w.id];
    if(jaTeNom){ onEnter({...w, nom:customNames[w.id]}); }
    else { setNomInput(""); setStep("name"); }
  };
  const handleConfirmName = () => {
    const nom = nomInput.trim();
    if(!nom) return;
    onEnter({...sel, nom, nomNou:true});
  };

  if(step==="name"&&sel){
    return(
      <div style={{minHeight:"100vh",background:"#f5f5f4",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,-apple-system,sans-serif"}}>
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{width:60,height:60,background:"#C0392B",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:28,fontWeight:700,margin:"0 auto 18px"}}>B</div>
          <h1 style={{fontSize:20,fontWeight:700,textAlign:"center",color:"#1a1a1a",marginBottom:6}}>Benvingut/da!</h1>
          <p style={{fontSize:13,color:"#6b7280",textAlign:"center",marginBottom:24}}>Ets <b>{sel.nom}</b>. Com t'agradaria que et mostrem a l'app?</p>
          <div style={{marginBottom:12}}>
            <label style={labelSt}>El teu nom</label>
            <input autoFocus style={{...inputSt,fontSize:15,padding:"10px 12px"}} placeholder={sel.nom} value={nomInput} onChange={e=>setNomInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleConfirmName()}/>
          </div>
          <button onClick={handleConfirmName} disabled={!nomInput.trim()} style={{width:"100%",padding:13,background:nomInput.trim()?"#C0392B":"#d1d5db",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:nomInput.trim()?"pointer":"not-allowed",fontFamily:"inherit",marginBottom:10}}>
            Entrar com a «{nomInput.trim()||"…"}» →
          </button>
          <button onClick={()=>setStep("pick")} style={{width:"100%",padding:10,background:"none",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer"}}>← Tornar a triar</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#f5f5f4",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{width:60,height:60,background:"#C0392B",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:28,fontWeight:700,margin:"0 auto 18px"}}>B</div>
        <h1 style={{fontSize:20,fontWeight:700,textAlign:"center",color:"#1a1a1a",marginBottom:6}}>Banc de Recursos Mancomunats</h1>
        <p style={{fontSize:13,color:"#6b7280",textAlign:"center",marginBottom:24}}>Qui ets? Tria el teu nom per continuar.</p>
        <div style={{display:"grid",gap:8,marginBottom:16}}>
          {WORKERS_DEF.map(w=>{
            const nomMostrat=customNames[w.id]||w.nom;
            const isFirst=!customNames[w.id];
            return(
              <button key={w.id} onClick={()=>handlePick(w)} style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e5e7eb",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:14,color:"#1a1a1a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#6b7280",flexShrink:0}}>{nomMostrat.slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{nomMostrat}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>{w.equip==="borsa"?"Borsa":w.rol==="oficina"?"Oficina":w.rol==="admin"?"Administradora":"Equip fix"}</div>
                </div>
                {isFirst&&<span style={{fontSize:10,background:"#fef9c3",color:"#a16207",borderRadius:4,padding:"2px 6px",fontWeight:700}}>1a vegada</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser] = useState(null);
  const [tab,setTab] = useState("resum");
  const [loading,setLoading] = useState(true);

  const [customNames,setCustomNames] = useState({});
  const [inv,setInv] = useState([]);
  const [bkgs,setBkgs] = useState([]);
  const [torns,setTorns] = useState([]);
  const [avisos,setAvisos] = useState([]);

  const [catF,setCatF] = useState("Totes");
  const [searchQ,setSearchQ] = useState("");
  const [notifState,setNotifState] = useState(null);
  const [avisIn,setAvisIn] = useState("");
  const [avisTip,setAvisTip] = useState("info");
  const [avisServ,setAvisServ] = useState("General");
  const [showAddInv,setShowAddInv] = useState(false);
  const [editInv,setEditInv] = useState(null);
  const [newInv,setNewInv] = useState({nom:"",categoria:CATS[1],total:1,disponible:1,estat:"bo",ubicacio:"",notes:""});
  const [showAddBkg,setShowAddBkg] = useState(false);
  const [newBkg,setNewBkg] = useState({entitat:"",inventari_id:"",quantitat:1,data_inici:"",data_fi:"",contacte:"",telefon:""});
  const [showNoms,setShowNoms] = useState(false);
  const [nomsEdit,setNomsEdit] = useState({});
  const [showEditTorn,setShowEditTorn] = useState(false);
  const [editTornData,setEditTornData] = useState(null);

  const notify = (msg,type="ok") => { setNotifState({msg,type}); setTimeout(()=>setNotifState(null),3200); };
  const canEdit = user?.rol==="oficina"||user?.rol==="admin";
  const wNom = (id) => customNames[id] || WORKERS_DEF.find(w=>w.id===id)?.nom || id;
  
  // Per mostrar el nom de l'inventari als pediments
  const getInvName = (id) => inv.find(i=>i.id===id)?.nom || "Material esborrat";

  // ── CÀRREGA INICIAL ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [noms, invData, avisosData, bkgsData, tornsData] = await Promise.all([
        db.get("worker_names"),
        db.get("inventari","order=id"),
        db.get("avisos","order=id.desc"),
        db.get("pediments","order=id.desc"),
        db.get("torns","order=id"),
      ]);

      const nomMap = {};
      noms.forEach(n=>{ nomMap[n.id]=n.nom; });
      setCustomNames(nomMap);

      if(invData.length===0){ await db.insert("inventari", INV_INIT); setInv(INV_INIT); } else { setInv(invData); }
      if(avisosData.length===0){ await db.insert("avisos", [{tipus:"info", missatge:"Benvinguts al Banc de Recursos", autor:"Sistema", servei:"General"}]); setAvisos([]); } else { setAvisos(avisosData); }
      if(bkgsData.length===0){ await db.insert("pediments", BKGS_INIT); setBkgs(BKGS_INIT); } else { setBkgs(bkgsData); }
      if(tornsData.length===0){ await db.insert("torns", TORNS_INIT); setTorns(TORNS_INIT); } else { setTorns(tornsData); }

    } catch(e){
      console.error(e);
      notify("Error connectant a la base de dades","err");
    }
    setLoading(false);
  }, []);

  useEffect(()=>{ loadAll(); },[loadAll]);

  // ── ENTRADA USUARI ───────────────────────────────────────────────────────────
  const handleEnter = async (u) => {
    if(u.nomNou){
      try {
        await db.upsert("worker_names",[{id:u.id, nom:u.nom}]);
        setCustomNames(p=>({...p,[u.id]:u.nom}));
      } catch(e){ console.error(e); }
    }
    setUser(u);
    setTab("resum");
  };

  if(loading) return(
    <div style={{minHeight:"100vh",background:"#f5f5f4",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{textAlign:"center"}}><div style={{width:50,height:50,background:"#C0392B",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,fontWeight:700,margin:"0 auto 16px"}}>B</div><div style={{color:"#6b7280",fontSize:14}}>Connectant…</div></div>
    </div>
  );

  if(!user) return <WelcomeScreen onEnter={handleEnter} customNames={customNames}/>;

  const tabs = [
    {id:"resum", label:"Resum", icon:"◈"},
    {id:"inventari", label:"Inventari", icon:"▦"},
    {id:"torns", label:"Torns", icon:"◷"},
    {id:"pediments", label:"Pediments", icon:"◻"},
    {id:"avisos", label:"Avisos", icon:"✉"},
    ...(canEdit?[{id:"oficina",label:"Oficina",icon:"⊞"}]:[]),
  ];

  const filtInv = inv.filter(i=>(catF==="Totes"||i.categoria===catF)&&(!searchQ||i.nom.toLowerCase().includes(searchQ.toLowerCase())));
  const avail = inv.reduce((a,i)=>a+i.disponible,0);
  const total = inv.reduce((a,i)=>a+i.total,0);
  const lowStock= inv.filter(i=>pct(i.disponible,i.total)<=25).length;
  const actBkgs = bkgs.filter(b=>b.estat==="activa"||b.estat==="confirmada").length;
  const diesSetmana = getSetmanaActual();

  const tornsPerTreballadorDia = (wId, dia) =>
    torns.filter(t=> String(t.worker_id) === String(wId) && t.dia === dia);

  const horesTreballador = (wId) =>
    torns.filter(t=> String(t.worker_id) === String(wId)).reduce((a,t)=>a+calcHoresTorn(t),0);

  // ── ACCIONS ──────────────────────────────────────────────────────────────────
  const saveInv = async () => {
    if(!newInv.nom) return;
    try {
      if(editInv){
        await db.update("inventari", editInv.id, newInv);
        setInv(v=>v.map(i=>i.id===editInv.id?{...i,...newInv}:i));
        notify("Material actualitzat");
      } else {
        const res = await db.insert("inventari",[newInv]);
        setInv(v=>[...v,...res]);
        notify("Material afegit");
      }
      setShowAddInv(false); setEditInv(null);
    } catch(e){ notify("Error desant material","err"); console.error(e); }
  };
  
  const deleteInv = async (item) => {
    if(!window.confirm(`Eliminar "${item.nom}"?`)) return;
    try { await db.delete("inventari", item.id); setInv(v=>v.filter(i=>i.id!==item.id)); notify("Eliminat"); }
    catch(e){ notify("Error eliminant","err"); }
  };

  const sendAvis = async () => {
    if(!avisIn.trim()) return;
    const nou = { tipus:avisTip, missatge:avisIn.trim(), autor:user.nom, servei:avisServ };
    try {
      const res = await db.insert("avisos",[nou]);
      setAvisos(av=>[...res,...av]);
      setAvisIn(""); notify("Avís enviat");
    } catch(e){ notify("Error enviant avís","err"); console.error(e); }
  };
  
  const deleteAvis = async (id) => {
    try { await db.delete("avisos", id); setAvisos(v=>v.filter(x=>x.id!==id)); notify("Eliminat"); }
    catch(e){ notify("Error eliminant","err"); }
  };

  const saveBkg = async () => {
    if(!newBkg.entitat||!newBkg.data_inici) return;
    const payload = { ...newBkg, inventari_id: Number(newBkg.inventari_id), estat:"pendent" };
    try {
      const res = await db.insert("pediments",[payload]);
      setBkgs(v=>[...res,...v]);
      notify("Pediment creat"); setShowAddBkg(false);
    } catch(e){ notify("Error creant pediment","err"); console.error(e); }
  };
  
  const updateBkgEstat = async (id, estat) => {
    try { await db.update("pediments", id, {estat}); setBkgs(v=>v.map(x=>x.id===id?{...x,estat}:x)); notify(estat==="confirmada"?"Confirmat":"Completat"); }
    catch(e){ notify("Error actualitzant","err"); }
  };
  
  const deleteBkg = async (id) => {
    if(!window.confirm("Eliminar?")) return;
    try { await db.delete("pediments", id); setBkgs(v=>v.filter(x=>x.id!==id)); notify("Eliminat"); }
    catch(e){ notify("Error eliminant","err"); }
  };

  const openNoms = () => {
    const init={}; WORKERS_DEF.forEach(w=>{ init[w.id]=customNames[w.id]||w.nom; }); setNomsEdit(init); setShowNoms(true);
  };
  
  const saveNoms = async () => {
    const rows = WORKERS_DEF.map(w=>({id:w.id, nom:nomsEdit[w.id]?.trim()||w.nom}));
    try {
      await db.upsert("worker_names", rows);
      const next={}; rows.forEach(r=>{ next[r.id]=r.nom; }); setCustomNames(next);
      if(next[user.id]) setUser(u=>({...u,nom:next[u.id]}));
      setShowNoms(false); notify("Noms actualitzats");
    } catch(e){ notify("Error desant noms","err"); }
  };

  const saveTorn = async () => {
    const {treballadorId, dia, torn, form} = editTornData;
    try {
      const w = WORKERS_DEF.find(x=>x.id===treballadorId);
      const payload = { worker_id: Number(treballadorId), dia, hora_entrada:form.hora_entrada, hora_sortida:form.hora_sortida, servei:form.servei, equip:w?.equip||"fix" };
      
      if(torn){
        await db.update("torns", torn.id, payload);
        setTorns(v=>v.map(t=>t.id===torn.id?{...t,...payload}:t));
        notify("Torn actualitzat");
      } else {
        const res = await db.insert("torns",[payload]);
        setTorns(v=>[...v,...res]);
        notify("Torn afegit");
      }
      setShowEditTorn(false);
    } catch(e){ notify("Error desant torn","err"); console.error(e); }
  };
  
  const deleteTorn = async (id) => {
    try { await db.delete("torns", id); setTorns(v=>v.filter(t=>t.id!==id)); notify("Torn eliminat"); }
    catch(e){ notify("Error eliminant torn","err"); }
  };

  const exportCSV = () => {
    const rows=[["Treballador","Equip","H. contractades","H. fetes","Diferència"],
      ...WORKERS_DEF.filter(w=>w.rol==="treballador").map(w=>{
        const hF=Math.round(horesTreballador(w.id)*10)/10;
        const diff=Math.round((hF-(w.hores||0))*10)/10;
        return[wNom(w.id),w.equip==="fix"?"Equip fix":"Borsa",w.hores||0,hF,(diff>=0?"+":"")+diff];
      })];
    const csv=rows.map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download="hores_setmana_brmcv.csv"; a.click(); notify("CSV descarregat");
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:"#f5f5f4",fontFamily:"system-ui,-apple-system,sans-serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} input,select,textarea{font-family:inherit} button{cursor:pointer} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px} tr:hover td{background:#faf9f8!important} input:focus,select:focus,textarea:focus{outline:2px solid #C0392B;outline-offset:1px}`}</style>

      {/* HEADER */}
      <header style={{background:"#C0392B",padding:"0 16px",display:"flex",alignItems:"center",gap:12,height:54,position:"sticky",top:0,zIndex:100}}>
        <div style={{width:30,height:30,background:"rgba(255,255,255,.2)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0}}>B</div>
        <div><div style={{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.2}}>Banc de Recursos Mancomunats</div><div style={{fontSize:10,color:"rgba(255,255,255,.7)"}}>Ciutat Vella</div></div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {lowStock>0&&<div style={{background:"rgba(0,0,0,.2)",borderRadius:16,padding:"3px 9px",fontSize:11,color:"#fca5a5",fontWeight:600}}>⚠ {lowStock} estoc baix</div>}
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"3px 10px",fontSize:11,color:"#fff"}}>{user.nom}</div>
          {canEdit&&<button onClick={openNoms} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,padding:"4px 8px",color:"rgba(255,255,255,.8)",fontSize:11}}>✏ Noms</button>}
          <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,padding:"4px 8px",color:"rgba(255,255,255,.8)",fontSize:11}}>Canviar</button>
        </div>
      </header>

      {/* NAV */}
      <nav style={{background:"#fff",borderBottom:"1px solid #e5e7eb",display:"flex",overflowX:"auto",padding:"0 8px"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"11px 13px",border:"none",background:"transparent",fontFamily:"inherit",fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?"#C0392B":"#6b7280",borderBottom:`2px solid ${tab===t.id?"#C0392B":"transparent"}`,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}><span>{t.icon}</span>{t.label}</button>))}
      </nav>

      {notifState&&<Notif msg={notifState.msg} type={notifState.type}/>}

      <main style={{maxWidth:1020,margin:"0 auto",padding:16}}>

        {/* RESUM */}
        {tab==="resum"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:16}}>Bon dia, {user.nom.split(" ")[0]}!</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
              {[{l:"Materials",v:inv.length,s:`${total} unitats`,c:"#C0392B"},{l:"Disponibles",v:avail,s:`de ${total}`,c:"#2563eb"},{l:"Reserves actives",v:actBkgs,s:`${bkgs.filter(b=>b.estat==="pendent").length} pendents`,c:"#7c3aed"},{l:"Estoc baix ⚠",v:lowStock,s:"Requereixen atenció",c:"#d97706"}].map(s=>(
                <div key={s.l} style={{background:"#fff",borderRadius:12,padding:"13px 15px",borderLeft:`3px solid ${s.c}`,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{s.l}</div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{s.s}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
              <h2 style={{fontSize:13,fontWeight:700,marginBottom:12}}>Últims avisos</h2>
              {avisos.slice(0,4).map(a=>(<div key={a.id} style={{display:"flex",gap:9,padding:"7px 0",borderBottom:"1px solid #f3f4f6"}}><div style={{width:7,height:7,borderRadius:"50%",background:avisColors[a.tipus]||"#888",marginTop:5,flexShrink:0}}/><div><div style={{fontSize:12,lineHeight:1.5}}>{a.missatge}</div><div style={{fontSize:11,color:"#9ca3af"}}>{a.autor}</div></div></div>))}
              <button onClick={()=>setTab("avisos")} style={{marginTop:10,background:"none",border:"none",color:"#C0392B",fontSize:12,fontWeight:600,padding:0}}>Veure tots →</button>
            </div>
          </div>
        )}

        {/* INVENTARI */}
        {tab==="inventari"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>Inventari</h1></div>
              <button onClick={()=>{setEditInv(null);setNewInv({nom:"",categoria:CATS[1],total:1,disponible:1,estat:"bo",ubicacio:"",notes:""});setShowAddInv(true)}} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:"8px 14px",fontWeight:700,fontSize:13}}>+ Afegir</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Cercar..." style={{...inputSt,flex:1,minWidth:120}}/>
              <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...inputSt,width:"auto"}}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #e5e7eb"}}>{["Material","Cat.","Disponible","Estat","Ubicació",""].map(h=><th key={h} style={{padding:"9px 11px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
                <tbody>{filtInv.map(item=>(<tr key={item.id} style={{borderBottom:"1px solid #f3f4f6"}}><td style={{padding:"9px 11px"}}><div style={{fontWeight:600}}>{item.nom}</div>{item.notes&&<div style={{fontSize:11,color:"#9ca3af"}}>{item.notes}</div>}</td><td style={{padding:"9px 11px",fontSize:12,color:"#6b7280"}}>{(item.categoria||"").split(" ")[0]}</td><td style={{padding:"9px 11px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontWeight:700,color:sColor(item.disponible,item.total)}}>{item.disponible}</span><span style={{fontSize:11,color:"#9ca3af"}}>/{item.total}</span></div></td><td style={{padding:"9px 11px"}}><Badge estat={item.estat}/></td><td style={{padding:"9px 11px",fontSize:12,color:"#6b7280"}}>{item.ubicacio}</td><td style={{padding:"9px 11px"}}><div style={{display:"flex",gap:5}}><button onClick={()=>{setEditInv(item);setNewInv({nom:item.nom,categoria:item.categoria,total:item.total,disponible:item.disponible,estat:item.estat,ubicacio:item.ubicacio,notes:item.notes});setShowAddInv(true)}} style={{background:"#f3f4f6",border:"none",borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:600,color:"#374151"}}>Editar</button><button onClick={()=>deleteInv(item)} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,color:"#b91c1c"}}>✕</button></div></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* TORNS */}
        {tab==="torns"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:14}}>Torns setmanals</h1>
            <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:580}}>
                <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #e5e7eb"}}><th style={{padding:"9px 11px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280"}}>Treballador</th><th style={{padding:"9px 6px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6b7280"}}>Contr.</th>{diesSetmana.map((d,i)=>(<th key={d} style={{padding:"9px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6b7280"}}>{DIES[i]}<br/><span style={{fontSize:9,fontWeight:400}}>{d.slice(5)}</span></th>))}<th style={{padding:"9px 11px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6b7280"}}>Total</th></tr></thead>
                <tbody>
                  {["fix","borsa"].map(eq=>[<tr key={eq}><td colSpan={8} style={{padding:"5px 11px",background:"#f9fafb",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{eq==="fix"?"Equip Operatiu":"Borsa"}</td></tr>,
                  ...WORKERS_DEF.filter(w=>w.equip===eq&&w.rol==="treballador").map(w=>{
                    const hF=Math.round(horesTreballador(w.id)*10)/10;
                    const diff=Math.round((hF-(w.hores||0))*10)/10;
                    const isMe=user.id===w.id;
                    return(<tr key={w.id} style={{borderBottom:"1px solid #f3f4f6",background:isMe?"#eff6ff":"transparent"}}><td style={{padding:"8px 11px",fontWeight:isMe?700:500,color:"#1a1a1a"}}>{wNom(w.id)}{isMe&&<span style={{fontSize:10,color:"#2563eb",marginLeft:5,fontWeight:700,background:"#dbeafe",borderRadius:4,padding:"1px 5px"}}>(tu)</span>}</td><td style={{padding:"8px 6px",textAlign:"center",color:"#6b7280",fontSize:12}}>{w.hores||"—"}</td>{diesSetmana.map((dia)=>{const tornsDia=tornsPerTreballadorDia(w.id,dia);return(<td key={dia} style={{padding:"4px 3px",textAlign:"center",verticalAlign:"top"}}>{tornsDia.length>0?tornsDia.map(t=>(<div key={t.id} style={{marginBottom:2}}><div style={{background:"#dcfce7",color:"#15803d",borderRadius:4,padding:"2px 4px",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{t.hora_entrada}–{t.hora_sortida}</div>{t.servei&&<div style={{fontSize:9,color:"#C0392B",fontWeight:600}}>{t.servei}</div>}{canEdit&&<button onClick={()=>deleteTorn(t.id)} style={{fontSize:9,color:"#9ca3af",background:"none",border:"none",padding:0,cursor:"pointer"}}>✕</button>}</div>)):<span style={{color:"#d1d5db",fontSize:11}}>—</span>}{canEdit&&<button onClick={()=>{setEditTornData({treballadorId:w.id,dia,torn:null,form:{hora_entrada:"08:00",hora_sortida:"15:00",servei:""}});setShowEditTorn(true);}} style={{fontSize:9,color:"#C0392B",background:"none",border:"none",padding:"2px 0",cursor:"pointer",display:"block",width:"100%",textAlign:"center"}}>+ torn</button>}</td>);})}<td style={{padding:"8px 11px",textAlign:"center"}}><div style={{fontWeight:700}}>{hF}h</div>{w.hores>0&&<div style={{fontSize:10,color:diff>=0?"#15803d":"#dc2626"}}>{diff>=0?"+":""}{diff}h</div>}</td></tr>);
                  })])}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PEDIMENTS */}
        {tab==="pediments"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>Pediments</h1></div>
              <button onClick={()=>{setNewBkg({entitat:"",inventari_id:inv[0]?.id||"",quantitat:1,data_inici:"",data_fi:"",contacte:"",telefon:""});setShowAddBkg(true)}} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:"8px 14px",fontWeight:700,fontSize:13}}>+ Nou</button>
            </div>
            <div style={{display:"grid",gap:10}}>
              {bkgs.map(b=>(
                <div key={b.id} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"center"}}>
                    <div><div style={{fontSize:10,color:"#9ca3af",textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Entitat</div><div style={{fontWeight:700,fontSize:13}}>{b.entitat}</div><div style={{fontSize:11,color:"#6b7280"}}>{b.contacte} · {b.telefon}</div></div>
                    <div><div style={{fontSize:10,color:"#9ca3af",textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Material</div><div style={{fontWeight:600,fontSize:13}}>{getInvName(b.inventari_id)}</div><div style={{fontSize:11,color:"#6b7280"}}>×{b.quantitat}</div></div>
                    <div><div style={{fontSize:10,color:"#9ca3af",textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Dates</div><div style={{fontWeight:600,fontSize:13}}>{b.data_inici} – {b.data_fi}</div></div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}><Badge estat={b.estat}/><div style={{display:"flex",gap:5}}>{b.estat==="pendent"&&<button onClick={()=>updateBkgEstat(b.id,"confirmada")} style={{background:"#dcfce7",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#15803d"}}>Confirmar</button>}{(b.estat==="confirmada"||b.estat==="activa")&&<button onClick={()=>updateBkgEstat(b.id,"completada")} style={{background:"#dbeafe",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#1d4ed8"}}>Completar</button>}<button onClick={()=>deleteBkg(b.id)} style={{background:"#fee2e2",border:"none",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,color:"#b91c1c"}}>✕</button></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AVISOS */}
        {tab==="avisos"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:14}}>Tauler d'avisos</h1>
            <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
              <h2 style={{fontSize:13,fontWeight:700,marginBottom:10}}>Enviar avís — {user.nom}</h2>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <select value={avisTip} onChange={e=>setAvisTip(e.target.value)} style={{...inputSt,width:"auto"}}><option value="info">Avís general</option><option value="ok">Servei completat</option><option value="warn">Incidència</option><option value="urgent">Urgent</option></select>
                <select value={avisServ} onChange={e=>setAvisServ(e.target.value)} style={{...inputSt,width:"auto"}}>{["General","GREC","ESPORT3","APC","SANT LLUC","COOP57"].map(s=><option key={s}>{s}</option>)}</select>
              </div>
              <div style={{display:"flex",gap:8}}><input value={avisIn} onChange={e=>setAvisIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAvis()} placeholder="Escriu el missatge aquí..." style={{...inputSt,flex:1}}/><button onClick={sendAvis} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>Enviar</button></div>
            </div>
            <div style={{display:"grid",gap:10}}>
              {avisos.map(a=>(<div key={a.id} style={{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",display:"flex",gap:12,alignItems:"flex-start"}}><div style={{width:9,height:9,borderRadius:"50%",background:avisColors[a.tipus]||"#888",marginTop:5,flexShrink:0}}/><div style={{flex:1}}><div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}><span style={{background:avisColors[a.tipus]+"22",color:avisColors[a.tipus],borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>{avisLabels[a.tipus]}</span><span style={{background:"#f3f4f6",color:"#6b7280",borderRadius:4,padding:"1px 7px",fontSize:10}}>{a.servei}</span></div><div style={{fontSize:13,lineHeight:1.5}}>{a.missatge}</div><div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>{a.autor}</div></div><button onClick={()=>deleteAvis(a.id)} style={{background:"none",border:"none",color:"#d1d5db",fontSize:14,cursor:"pointer",flexShrink:0}}>✕</button></div>))}
            </div>
          </div>
        )}

        {/* OFICINA */}
        {tab==="oficina"&&canEdit&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:14}}>Panel d'oficina</h1>
            <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
              <h2 style={{fontSize:13,fontWeight:700,marginBottom:14}}>Hores treballades — setmana actual</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,padding:"5px 0",borderBottom:"2px solid #e5e7eb",marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:"#6b7280"}}>Treballador</span><span style={{fontSize:11,fontWeight:700,color:"#6b7280",textAlign:"center"}}>Contr.</span><span style={{fontSize:11,fontWeight:700,color:"#6b7280",textAlign:"center"}}>Fetes</span><span style={{fontSize:11,fontWeight:700,color:"#6b7280",textAlign:"center"}}>Diferència</span></div>
              {WORKERS_DEF.filter(w=>w.rol==="treballador").map(w=>{const hF=Math.round(horesTreballador(w.id)*10)/10;const diff=Math.round((hF-(w.hores||0))*10)/10;return(<div key={w.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f3f4f6"}}><div><span style={{fontWeight:600,fontSize:13}}>{wNom(w.id)}</span><span style={{fontSize:11,color:"#9ca3af",marginLeft:6}}>{w.equip==="fix"?"Fix":"Borsa"}</span></div><div style={{textAlign:"center",fontSize:13,color:"#6b7280"}}>{w.hores||"—"}</div><div style={{textAlign:"center",fontWeight:700,fontSize:13}}>{hF}h</div><div style={{textAlign:"center"}}>{w.hores>0?<span style={{fontSize:12,fontWeight:700,color:diff>0?"#15803d":diff<0?"#dc2626":"#6b7280",background:diff>0?"#dcfce7":diff<0?"#fee2e2":"#f3f4f6",borderRadius:6,padding:"2px 8px"}}>{diff>=0?"+":""}{diff}h</span>:<span style={{color:"#d1d5db"}}>—</span>}</div></div>);})}
              <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid #f3f4f6"}}><button onClick={exportCSV} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontWeight:700,fontSize:13}}>⬇ Descarregar CSV</button></div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {showAddInv&&(<Modal title={editInv?"Editar material":"Nou material"} onClose={()=>{setShowAddInv(false);setEditInv(null);}}><div style={{display:"grid",gap:12}}><div><label style={labelSt}>Nom</label><input style={inputSt} value={newInv.nom} onChange={e=>setNewInv(p=>({...p,nom:e.target.value}))}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={labelSt}>Categoria</label><select style={inputSt} value={newInv.categoria} onChange={e=>setNewInv(p=>({...p,categoria:e.target.value}))}>{CATS.slice(1).map(c=><option key={c}>{c}</option>)}</select></div><div><label style={labelSt}>Estat</label><select style={inputSt} value={newInv.estat} onChange={e=>setNewInv(p=>({...p,estat:e.target.value}))}><option value="bo">Bo</option><option value="manteniment">Manteniment</option><option value="baixa">Baixa</option></select></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={labelSt}>Total</label><input type="number" style={inputSt} min={0} value={newInv.total} onChange={e=>setNewInv(p=>({...p,total:+e.target.value}))}/></div><div><label style={labelSt}>Disponible</label><input type="number" style={inputSt} min={0} value={newInv.disponible} onChange={e=>setNewInv(p=>({...p,disponible:+e.target.value}))}/></div></div><div><label style={labelSt}>Ubicació</label><input style={inputSt} value={newInv.ubicacio} onChange={e=>setNewInv(p=>({...p,ubicacio:e.target.value}))}/></div><div><label style={labelSt}>Notes</label><textarea style={{...inputSt,resize:"vertical",minHeight:60}} value={newInv.notes} onChange={e=>setNewInv(p=>({...p,notes:e.target.value}))}/></div><button onClick={saveInv} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14,marginTop:4}}>{editInv?"Actualitzar":"Afegir"}</button></div></Modal>)}

      {showAddBkg&&(<Modal title="Nou pediment" onClose={()=>setShowAddBkg(false)}><div style={{display:"grid",gap:12}}><div><label style={labelSt}>Entitat</label><input style={inputSt} value={newBkg.entitat} onChange={e=>setNewBkg(p=>({...p,entitat:e.target.value}))}/></div><div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}><div><label style={labelSt}>Material</label><select style={inputSt} value={newBkg.inventari_id} onChange={e=>setNewBkg(p=>({...p,inventari_id:e.target.value}))}>{inv.map(i=><option key={i.id} value={i.id}>{i.nom}</option>)}</select></div><div style={{width:80}}><label style={labelSt}>Quantitat</label><input type="number" style={inputSt} min={1} value={newBkg.quantitat} onChange={e=>setNewBkg(p=>({...p,quantitat:+e.target.value}))}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={labelSt}>Data inici</label><input type="date" style={inputSt} value={newBkg.data_inici} onChange={e=>setNewBkg(p=>({...p,data_inici:e.target.value}))}/></div><div><label style={labelSt}>Data fi</label><input type="date" style={inputSt} value={newBkg.data_fi} onChange={e=>setNewBkg(p=>({...p,data_fi:e.target.value}))}/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={labelSt}>Contacte</label><input style={inputSt} value={newBkg.contacte} onChange={e=>setNewBkg(p=>({...p,contacte:e.target.value}))}/></div><div><label style={labelSt}>Telèfon</label><input style={inputSt} value={newBkg.telefon} onChange={e=>setNewBkg(p=>({...p,telefon:e.target.value}))}/></div></div><button onClick={saveBkg} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14,marginTop:4}}>Crear pediment</button></div></Modal>)}

      {showNoms&&(<Modal title="Editar noms" onClose={()=>setShowNoms(false)}><div style={{display:"grid",gap:10}}>{WORKERS_DEF.map(w=>(<div key={w.id} style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:8,alignItems:"center"}}><label style={{...labelSt,marginBottom:0,fontSize:10}}>{w.nom}</label><input style={{...inputSt,fontSize:13}} value={nomsEdit[w.id]||""} onChange={e=>setNomsEdit(p=>({...p,[w.id]:e.target.value}))}/></div>))}</div><button onClick={saveNoms} style={{width:"100%",marginTop:16,background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14}}>Desar noms</button></Modal>)}

      {showEditTorn&&editTornData&&(<Modal title={editTornData.torn?"Editar torn":"Nou torn"} onClose={()=>setShowEditTorn(false)}><p style={{fontSize:12,color:"#6b7280",marginBottom:14}}><b>{wNom(editTornData.treballadorId)}</b> · {editTornData.dia}</p><div style={{display:"grid",gap:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={labelSt}>Entrada</label><input type="time" style={inputSt} value={editTornData.form.hora_entrada} onChange={e=>setEditTornData(p=>({...p,form:{...p.form,hora_entrada:e.target.value}}))}/></div><div><label style={labelSt}>Sortida</label><input type="time" style={inputSt} value={editTornData.form.hora_sortida} onChange={e=>setEditTornData(p=>({...p,form:{...p.form,hora_sortida:e.target.value}}))}/></div></div><div><label style={labelSt}>Servei</label><select style={inputSt} value={editTornData.form.servei} onChange={e=>setEditTornData(p=>({...p,form:{...p.form,servei:e.target.value}}))}><option value="">— Sense servei —</option>{["GREC","ESPORT3","APC","SANT LLUC","COOP57"].map(s=><option key={s}>{s}</option>)}</select></div><button onClick={saveTorn} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14,marginTop:4}}>{editTornData.torn?"Actualitzar":"Afegir"}</button></div></Modal>)}

    </div>
  );
}
