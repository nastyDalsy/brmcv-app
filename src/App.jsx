
Banc de Recursos
millorar el sistema del banc de recusos, tant el outlook de l'empresa/treballadors com la web per a clients i control d'inventari

Claude Fable 5 no está disponible en este momento.
Más información(opens in new tab)


¿Cómo puedo ayudarle hoy?


Actualitzacions gestió serveis i torns Vercel
Último mensaje hace 4 horas
Redisseny del Banc de recursos amb control d'inventari
Último mensaje hace 18 horas
Tecnologies i serveis online del projecte
Último mensaje ayer
Project brief for Grok
Último mensaje ayer
Demostración de capacidades con Claude para proyecto web
Último mensaje ayer
Preparació reunió IT per app i web
Último mensaje hace 4 días
Sistema de gestión de inventario y pedidos para empresa de alquiler
Último mensaje 30 may
Propuesta de mejoras informáticas para la oficina
Último mensaje 30 may
Acceso al archivo de horarios compartido
Último mensaje 30 may
Problemes tècnics web banc de recursos
Último mensaje 30 may
Memoria
Solo tú
Purpose & context Dalsy works at the Banc de Recursos Mancomunats de Ciutat Vella (BRMCV), a community resource-sharing organization based at Carrer Tàpies, 6 in the Ciutat Vella district of Barcelona. The organization lends and delivers event equipment (tents, chairs, tables, sound systems, etc.) to local entities, managing an inventory of hundreds of items across multiple services (GREC, ESPORT3, APC, SANT LLUC, COOP57). The overarching goal is to modernize the organization's digital operations through two sequential phases: Internal management app (current focus) — a tool for workers to manage inventory, shifts, loan requests, and team communications Public-facing website improvement (subsequent phase) — improving recursosmancomunats.org (WordPress/WooCommerce/Elementor) Dalsy is positioned to serve as administrator of the technical accounts and infrastructure, with Claude handling technical configuration. The audience for internal tools includes colleagues with limited technical knowledge. All work and documentation is conducted in Catalan. --- Current state A React-based internal management app has been prototyped with five main sections: Resum – dashboard with stats and recent activity Inventari – catalog based on real items from recursosmancomunats.org Torns – weekly shift tracking (replacing a SharePoint Excel), with hours-worked vs. contracted comparison Pediments – entity loan requests Avisos – internal notice board (replacing WhatsApp for work communications) Oficina panel – CSV export of hours for payroll processing Serveis tab – editable cards per service with address, schedule, contact, materials, and notes The app is intended as a prototype to present to organizational leadership before full deployment. Key constraints established: Worker names do not appear in the app (use "Treballador 1, 2…" anonymization) Inventory reflects the real catalog from the website Microsoft Outlook/SharePoint integration was explored and dropped as too complex The solution must be entirely free: GitHub + Supabase + Vercel Supabase is reserved for exceptional cases (data recovery, CSV export); workers manage data directly from the app Claude has produced supporting PDF documentation in Catalan: a technical installation guide and two versions of an administrator guide (the second clarifying that Supabase is not for routine use). --- On the horizon Dalsy taking ownership of GitHub, Supabase, and Vercel accounts and deploying the app Presenting the prototype to BRMCV leadership for approval Phase 2: improving the public website (recursosmancomunats.org) — options previously identified include enhancing the WordPress setup with booking/form plugins, migrating to a purpose-built platform, or a full rebuild (e.g., Next.js + Supabase) A functional online request/reservation system for the website remains unbuilt (currently only PDFs and "Read more" buttons exist) --- Key learnings & principles The organization's existing pain points center on lack of real-time inventory visibility, overlapping order conflicts, and worker communication gaps (previously managed via SharePoint Excel and WhatsApp) Simpler, free-tier solutions are strongly preferred over technically complex integrations Documentation must be non-technical and accessible, clearly distinguishing what workers do vs. what the administrator does Earlier Microsoft 365-based approaches (Outlook calendar sharing, Airtable CSVs) were explored but superseded by the current React + Supabase stack PDF deliverables require clean, table-based layouts — previous versions with overlapping visual elements were flagged and corrected --- Tools & resources App stack: React (JSX), Supabase, Vercel, GitHub Current org tools: Microsoft 365 (Outlook, SharePoint), WordPress/WooCommerce/Elementor (public site) Reference site: recursosmancomunats.org Documentation: ReportLab (for PDF generation in Catalan)

Última actualización 8 jun

Instrucciones
Agregar instrucciones para personalizar las respuestas de Claude

Archivos

brmcv-gestio.jsx
782 líneas

jsx


brmcv-gestio.jsx
import { useState, useEffect } from "react";
 
// ── WORKERS ───────────────────────────────────────────────────────────────────
const WORKERS_DEF = [
  { id:"w1", nom:"Treballador 1", equip:"fix",   hores:35, rol:"treballador" },
  { id:"w2", nom:"Treballador 2", equip:"fix",   hores:25, rol:"treballador" },
  { id:"w3", nom:"Treballador 3", equip:"fix",   hores:25, rol:"treballador" },
  { id:"w4", nom:"Treballador 4", equip:"fix",   hores:18, rol:"treballador" },
  { id:"w5", nom:"Treballador 5", equip:"borsa", hores:18, rol:"treballador" },
  { id:"w6", nom:"Treballador 6", equip:"borsa", hores:0,  rol:"treballador" },
  { id:"w7", nom:"Treballador 7", equip:"borsa", hores:0,  rol:"treballador" },
  { id:"of", nom:"Persona d'oficina", equip:"fix", hores:0, rol:"oficina" },
  { id:"adm",nom:"Dalsy (Admin)", equip:"fix",   hores:0,  rol:"admin" },
];
 
const LS_NAMES_KEY = "brmcv_worker_names";
const LS_USER_KEY  = "brmcv_last_user";
 
// Returns saved custom names from localStorage, merged with defaults
function loadNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_NAMES_KEY) || "{}");
    return saved;
  } catch { return {}; }
}
function saveNames(names) {
  localStorage.setItem(LS_NAMES_KEY, JSON.stringify(names));
}
function getWorkerNom(id, customNames) {
  return customNames[id] || WORKERS_DEF.find(w=>w.id===id)?.nom || id;
}
 
// ── TORNS ─────────────────────────────────────────────────────────────────────
const TORNS_DATA = {
  w1:[{e:"9:00",s:"15:00",srv:"GREC"},{e:"10:00",s:"12:00",srv:"GREC"},{e:"12:00",s:"15:00",srv:""},{e:"8:00",s:"13:00",srv:"GREC"},{e:"9:00",s:"15:00",srv:"GREC"}],
  w2:[{e:"7:00",s:"15:00",srv:"GREC"},{e:"7:00",s:"15:00",srv:"ESPORT3"},{e:"7:00",s:"15:00",srv:"APC"},{e:"7:00",s:"15:00",srv:"GREC"},{e:"7:00",s:"15:00",srv:"COOP57"}],
  w3:[{e:"7:00",s:"15:00",srv:"GREC"},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:"APC"},{e:"7:00",s:"15:00",srv:"SANT LLUC"},{e:"7:00",s:"15:00",srv:""}],
  w4:[{e:"7:00",s:"15:00",srv:"GREC"},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""}],
  w5:[{e:"10:00",s:"12:00",srv:"GREC"},{e:"12:00",s:"13:00",srv:""},{e:"13:00",s:"15:00",srv:""},{e:"",s:"",srv:""},{e:"15:00",s:"17:00",srv:"COOP57"}],
  w6:[{e:"7:00",s:"15:00",srv:"GREC"},{e:"",s:"",srv:""},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""}],
  w7:[{e:"",s:"",srv:""},{e:"7:00",s:"15:00",srv:"GREC"},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""},{e:"7:00",s:"15:00",srv:""}],
};
 
// ── INVENTARI COMPLET (44 materials de recursosmancomunats.org) ───────────────
const INV_INIT = [
  // Mobiliari
  {id:1,  nom:"Cadira Garrotxa",                        cat:"Mobiliari",       total:80, disp:72, estat:"bo",          ubi:"Magatzem A", notes:"Apilable fins 8 unitats"},
  {id:2,  nom:"Cadira Garrotxa amb braços",             cat:"Mobiliari",       total:20, disp:18, estat:"bo",          ubi:"Magatzem A", notes:""},
  {id:3,  nom:"Cadira plegable",                        cat:"Mobiliari",       total:50, disp:44, estat:"bo",          ubi:"Magatzem A", notes:""},
  {id:4,  nom:"Tamboret alt",                           cat:"Mobiliari",       total:12, disp:10, estat:"bo",          ubi:"Magatzem A", notes:""},
  {id:5,  nom:"Taula plegable rectangular",             cat:"Mobiliari",       total:20, disp:16, estat:"bo",          ubi:"Magatzem A", notes:"180×70 cm"},
  {id:6,  nom:"Taula plegable rodona",                  cat:"Mobiliari",       total:8,  disp:7,  estat:"bo",          ubi:"Magatzem A", notes:"Ø 120 cm"},
  {id:7,  nom:"Taula alta de còctel",                   cat:"Mobiliari",       total:6,  disp:5,  estat:"bo",          ubi:"Magatzem A", notes:""},
  {id:8,  nom:"Faristol",                               cat:"Mobiliari",       total:4,  disp:3,  estat:"bo",          ubi:"Magatzem A", notes:"Regulable en alçada"},
  {id:9,  nom:"Tarima baixa (mòdul 1×1 m)",            cat:"Mobiliari",       total:20, disp:16, estat:"bo",          ubi:"Magatzem B", notes:"Combinables"},
  {id:10, nom:"Tarima alta (mòdul 1×1 m)",             cat:"Mobiliari",       total:12, disp:10, estat:"bo",          ubi:"Magatzem B", notes:"Alçada 60 cm"},
  {id:11, nom:"Escala d'accés a tarima",                cat:"Mobiliari",       total:4,  disp:4,  estat:"bo",          ubi:"Magatzem B", notes:""},
  {id:12, nom:"Passarel·la / passadís de tarima",       cat:"Mobiliari",       total:6,  disp:5,  estat:"bo",          ubi:"Magatzem B", notes:""},
  // Infraestructura
  {id:13, nom:"Carpa lleugera 3×3 m",                  cat:"Infraestructura", total:6,  disp:4,  estat:"bo",          ubi:"Magatzem B", notes:"Inclou sacs de sorra"},
  {id:14, nom:"Carpa lleugera 3×6 m",                  cat:"Infraestructura", total:3,  disp:2,  estat:"bo",          ubi:"Magatzem B", notes:""},
  {id:15, nom:"Carpa robusta 5×5 m",                   cat:"Infraestructura", total:2,  disp:1,  estat:"bo",          ubi:"Magatzem B", notes:"Cal 4 persones per muntar"},
  {id:16, nom:"Carpa robusta 6×12 m",                  cat:"Infraestructura", total:1,  disp:0,  estat:"bo",          ubi:"Magatzem B", notes:"Reservada"},
  {id:17, nom:"Valla de seguretat New Jersey",          cat:"Infraestructura", total:20, disp:18, estat:"bo",          ubi:"Exterior",   notes:""},
  {id:18, nom:"Passa-cables de terra",                  cat:"Infraestructura", total:8,  disp:6,  estat:"bo",          ubi:"Magatzem A", notes:""},
  {id:19, nom:"Allargador 25 m (CEE 16A)",             cat:"Infraestructura", total:6,  disp:5,  estat:"bo",          ubi:"Magatzem A", notes:""},
  {id:20, nom:"Quadre elèctric portàtil",               cat:"Infraestructura", total:2,  disp:2,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  // Equip de so
  {id:21, nom:"Altaveu Behringer Europort MPA100BT",   cat:"Equip de so",     total:4,  disp:3,  estat:"bo",          ubi:"Sala tècnica", notes:"Bateria 8h, Bluetooth"},
  {id:22, nom:"Pack de so 2000W + SUB",                cat:"Equip de so",     total:1,  disp:0,  estat:"bo",          ubi:"Sala tècnica", notes:"Reservat fins 20/06"},
  {id:23, nom:"Pack de so 4000W + SUB",                cat:"Equip de so",     total:1,  disp:1,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  {id:24, nom:"Mesclador de so 12 canals",             cat:"Equip de so",     total:2,  disp:2,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  {id:25, nom:"Micròfon de diadema",                   cat:"Equip de so",     total:4,  disp:3,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  {id:26, nom:"Micròfon de mà sense fil",              cat:"Equip de so",     total:4,  disp:4,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  {id:27, nom:"Peu de micròfon",                       cat:"Equip de so",     total:6,  disp:6,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  {id:28, nom:"Caixa directa DI",                      cat:"Equip de so",     total:4,  disp:4,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  // Equip de llums
  {id:29, nom:"Catenàries LED 10 m",                   cat:"Equip de llums",  total:10, disp:8,  estat:"bo",          ubi:"Sala tècnica", notes:"Sèrie E27"},
  {id:30, nom:"Barra de focus LED RGB",                cat:"Equip de llums",  total:6,  disp:4,  estat:"bo",          ubi:"Sala tècnica", notes:"Control DMX"},
  {id:31, nom:"Par LED de terra",                      cat:"Equip de llums",  total:8,  disp:6,  estat:"bo",          ubi:"Sala tècnica", notes:"RGBW"},
  {id:32, nom:"Dimmer Pack Eurolite EDX-4R",           cat:"Equip de llums",  total:2,  disp:1,  estat:"manteniment", ubi:"Sala tècnica", notes:"1 unitat en reparació"},
  {id:33, nom:"Projector Full HD",                     cat:"Equip de llums",  total:1,  disp:1,  estat:"bo",          ubi:"Sala tècnica", notes:"HDMI + VGA"},
  {id:34, nom:"Pantalla de projecció 200×200 cm",      cat:"Equip de llums",  total:2,  disp:2,  estat:"bo",          ubi:"Magatzem A",  notes:""},
  {id:35, nom:"Controlador DMX",                       cat:"Equip de llums",  total:1,  disp:1,  estat:"bo",          ubi:"Sala tècnica", notes:""},
  // Cuina i restauració
  {id:36, nom:"Paella gran (Ø 80 cm)",                 cat:"Altres",          total:2,  disp:2,  estat:"bo",          ubi:"Magatzem B",  notes:""},
  {id:37, nom:"Cremador de paella gran",               cat:"Altres",          total:3,  disp:2,  estat:"bo",          ubi:"Magatzem B",  notes:"Gas butà"},
  {id:38, nom:"Taula calenta / bufet",                 cat:"Altres",          total:2,  disp:2,  estat:"bo",          ubi:"Magatzem B",  notes:""},
  {id:39, nom:"Font d'aigua freda/calenta",            cat:"Altres",          total:1,  disp:1,  estat:"bo",          ubi:"Magatzem B",  notes:""},
  // Decoració i espai
  {id:40, nom:"Catifa de gespa artificial (2×3 m)",   cat:"Altres",          total:4,  disp:3,  estat:"bo",          ubi:"Magatzem B",  notes:""},
  {id:41, nom:"Plantes decoratives artificials",       cat:"Altres",          total:10, disp:9,  estat:"bo",          ubi:"Magatzem B",  notes:""},
  {id:42, nom:"Senyalètica i rètols en blanc",         cat:"Altres",          total:20, disp:18, estat:"bo",          ubi:"Magatzem A",  notes:""},
  // Dispositius i accessibilitat
  {id:43, nom:"Audioguia",                             cat:"Altres",          total:5,  disp:5,  estat:"bo",          ubi:"Magatzem A",  notes:"Recàrrega USB"},
  {id:44, nom:"Bucle magnètic portàtil",               cat:"Altres",          total:1,  disp:1,  estat:"bo",          ubi:"Sala tècnica", notes:"Accessibilitat auditiva"},
];
 
// ── SERVEIS ───────────────────────────────────────────────────────────────────
const SERVS_INIT = [
  {id:"GREC",     nom:"GREC",      color:"#2563eb", adresa:"Carrer dels Àngels, 2, El Raval",  horari:"Dl-Dv 8:00–16:00",  contacte:"coordinacio@grec.cat · 93 000 00 01",    materials:"20 cadires Garrotxa, 2 taules, equip de so petit", instruccions:"Accés per la porta lateral. Deixar les cadires a la sala polivalent.",notes:""},
  {id:"ESPORT3",  nom:"ESPORT3",   color:"#15803d", adresa:"Carrer de les Tàpies, 20",         horari:"Dm i Dj 9:00–17:00", contacte:"esport3@esport3.cat · 93 000 00 02",     materials:"Tarimes, micròfon diadema, altaveu portàtil",      instruccions:"Muntar tarima 30 min abans. Aparcar al pati interior.",notes:""},
  {id:"APC",      nom:"APC",       color:"#a16207", adresa:"Plaça de la Gardunya, s/n",         horari:"Dx 10:00–18:00",     contacte:"info@apc.org · 93 000 00 03",            materials:"Carpa lleugera 3×3, 10 cadires, 1 taula",          instruccions:"La carpa s'instal·la a la plaça, zona est. Confirmar permís municipal.",notes:""},
  {id:"SANTLLUC", nom:"SANT LLUC", color:"#374151", adresa:"Carrer de Sant Lluc, 8",            horari:"Dj 9:00–14:00",      contacte:"santlluc@gmail.com · 93 000 00 04",       materials:"10 cadires, 1 taula plegable, catenàries",         instruccions:"Pujar al primer pis. Material al passadís.",notes:""},
  {id:"COOP57",   nom:"COOP57",    color:"#b91c1c", adresa:"Carrer de Premià, 15",              horari:"Dv 10:00–15:00",     contacte:"comunicacio@coop57.coop · 93 000 00 05", materials:"Pack 2000W, micròfon, 30 cadires, 5 taules",        instruccions:"Accés per la porta principal. Material al magatzem planta baixa.",notes:""},
];
 
const AVISOS_INIT = [
  {id:1,tipus:"ok",    text:"Servei GREC completat. 30 cadires retornades al magatzem.", autor:"Treballador 1",     servei:"GREC",    temps:"fa 2 hores"},
  {id:2,tipus:"warn",  text:"Dimmer Pack Eurolite en reparació fins dimarts.",           autor:"Persona d'oficina", servei:"General", temps:"ahir"},
  {id:3,tipus:"urgent",text:"Pack 2000W+SUB reservat fins el 20/06 — no cedir.",         autor:"Persona d'oficina", servei:"General", temps:"fa 1 dia"},
];
 
const BKGS_INIT = [
  {id:1,entitat:"Ass. Veïns El Raval",      material:"Cadira Garrotxa",qty:30,ini:"10/06",fi:"11/06",estat:"confirmada",contacte:"Maria G.",tel:"600 123 456"},
  {id:2,entitat:"Club Esportiu Gòtic",      material:"Carpa lleugera 3×3 m", qty:2, ini:"14/06",fi:"15/06",estat:"pendent",   contacte:"Jordi L.",tel:"611 234 567"},
  {id:3,entitat:"Biblioteca de les Coses",  material:"Taula plegable rectangular", qty:6, ini:"08/06",fi:"09/06",estat:"activa",    contacte:"Anna M.", tel:"622 345 678"},
];
 
const CATS = ["Totes","Mobiliari","Infraestructura","Equip de so","Equip de llums","Altres"];
const avisColors = {ok:"#16a34a",warn:"#d97706",urgent:"#dc2626",info:"#2563eb"};
const avisLabels = {ok:"Servei completat",warn:"Incidència",urgent:"Urgent",info:"Avís general"};
const pct = (d,t) => t ? Math.round(d/t*100) : 0;
const sColor = (d,t) => { const p=pct(d,t); return p>60?"#16a34a":p>25?"#d97706":"#dc2626"; };
const calcH = torns => torns.reduce((a,t)=>{
  if(!t.e||!t.s) return a;
  const[eh,em]=t.e.split(":").map(Number);
  const[sh,sm]=t.s.split(":").map(Number);
  return a+(sh*60+sm-eh*60-em)/60;
},0);
 
// Normalitza l'id del servei per cercar-lo (elimina espais)
const normSrvId = s => s ? s.replace(/\s/g,"") : s;
 
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
      <div style={{background:"#fff",borderRadius:18,padding:24,width:"100%",maxWidth:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
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
// Cada usuari tria el seu perfil i, si és la primera vegada, introdueix el seu nom.
function WelcomeScreen({onEnter, customNames, onSaveName}){
  const [sel, setSel]       = useState(null);
  const [step, setStep]     = useState("pick"); // "pick" | "name"
  const [nomInput, setNomInput] = useState("");
 
  const handlePick = (w) => {
    setSel(w);
    const jaTeNom = !!customNames[w.id];
    if(jaTeNom){
      // Ja tenia nom: entra directament
      onEnter({...w, nom: customNames[w.id]});
    } else {
      // Primera vegada: demana nom
      setNomInput("");
      setStep("name");
    }
  };
 
  const handleConfirmName = () => {
    const nom = nomInput.trim();
    if(!nom) return;
    onSaveName(sel.id, nom);
    onEnter({...sel, nom});
  };
 
  if(step === "name" && sel){
    return(
      <div style={{minHeight:"100vh",background:"#f5f5f4",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,-apple-system,sans-serif"}}>
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{width:60,height:60,background:"#C0392B",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:28,fontWeight:700,margin:"0 auto 18px"}}>B</div>
          <h1 style={{fontSize:20,fontWeight:700,textAlign:"center",color:"#1a1a1a",marginBottom:6}}>Benvingut/da!</h1>
          <p style={{fontSize:13,color:"#6b7280",textAlign:"center",marginBottom:24}}>
            Ets <b>{sel.nom}</b>. Com t'agradaria que et mostrem a l'app?<br/>
            <span style={{fontSize:12,color:"#9ca3af"}}>Només se't demanarà una vegada.</span>
          </p>
          <div style={{marginBottom:12}}>
            <label style={labelSt}>El teu nom</label>
            <input
              autoFocus
              style={{...inputSt, fontSize:15, padding:"10px 12px"}}
              placeholder={sel.nom}
              value={nomInput}
              onChange={e=>setNomInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleConfirmName()}
            />
          </div>
          <button
            onClick={handleConfirmName}
            disabled={!nomInput.trim()}
            style={{width:"100%",padding:13,background:nomInput.trim()?"#C0392B":"#d1d5db",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:nomInput.trim()?"pointer":"not-allowed",fontFamily:"inherit",transition:"background .2s",marginBottom:10}}
          >
            Entrar com a «{nomInput.trim()||"…"}» →
          </button>
          <button onClick={()=>setStep("pick")} style={{width:"100%",padding:10,background:"none",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer"}}>
            ← Tornar a triar
          </button>
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
            const nomMostrat = customNames[w.id] || w.nom;
            const isFirst = !customNames[w.id];
            return(
              <button key={w.id} onClick={()=>handlePick(w)}
                style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e5e7eb",borderRadius:12,background:"#fff",fontFamily:"inherit",fontSize:14,color:"#1a1a1a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#6b7280",flexShrink:0}}>{nomMostrat.slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{nomMostrat}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>{w.equip==="borsa"?"Borsa":w.rol==="oficina"?"Oficina":w.rol==="admin"?"Administradora":"Equip fix"}</div>
                </div>
                {isFirst && <span style={{fontSize:10,background:"#fef9c3",color:"#a16207",borderRadius:4,padding:"2px 6px",fontWeight:700}}>1a vegada</span>}
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
  // Noms personalitzats (localStorage)
  const [customNames, setCustomNames] = useState(loadNames);
 
  const saveName = (id, nom) => {
    const next = {...customNames, [id]: nom};
    setCustomNames(next);
    saveNames(next);
  };
 
  const [user,setUser]       = useState(null);
  const [tab,setTab]         = useState("resum");
  const [inv,setInv]         = useState(INV_INIT);
  const [servs,setServs]     = useState(SERVS_INIT);
  const [avisos,setAvisos]   = useState(AVISOS_INIT);
  const [bkgs,setBkgs]       = useState(BKGS_INIT);
  const [selServ,setSelServ] = useState(null);
  const [catF,setCatF]       = useState("Totes");
  const [searchQ,setSearchQ] = useState("");
  const [notifState,setNotifState] = useState(null);
  const [avisIn,setAvisIn]   = useState("");
  const [avisTip,setAvisTip] = useState("info");
  const [avisServ,setAvisServ]= useState("General");
  const [showAddInv,setShowAddInv] = useState(false);
  const [editInv,setEditInv] = useState(null);
  const [newInv,setNewInv]   = useState({nom:"",cat:CATS[1],total:1,disp:1,estat:"bo",ubi:"",notes:""});
  const [showAddBkg,setShowAddBkg] = useState(false);
  const [newBkg,setNewBkg]   = useState({entitat:"",material:INV_INIT[0].nom,qty:1,ini:"",fi:"",contacte:"",tel:""});
  // Modal per canviar noms (admin/oficina)
  const [showNoms, setShowNoms] = useState(false);
  const [nomsEdit, setNomsEdit] = useState({});
 
  const notify = (msg,type="ok") => { setNotifState({msg,type}); setTimeout(()=>setNotifState(null),3000); };
  const canEdit = user?.rol==="oficina"||user?.rol==="admin";
 
  // Funció per obtenir el nom mostrat d'un worker tenint en compte customNames
  const wNom = (id) => getWorkerNom(id, customNames);
 
  if(!user) return <WelcomeScreen onEnter={u=>{setUser(u);setTab("resum");}} customNames={customNames} onSaveName={saveName}/>;
 
  const tabs = [
    {id:"resum",    label:"Resum",     icon:"◈"},
    {id:"inventari",label:"Inventari", icon:"▦"},
    {id:"torns",    label:"Torns",     icon:"◷"},
    {id:"serveis",  label:"Serveis",   icon:"⊙"},
    {id:"pediments",label:"Pediments", icon:"◻"},
    {id:"avisos",   label:"Avisos",    icon:"✉"},
    ...(canEdit?[{id:"oficina",label:"Oficina",icon:"⊞"}]:[]),
  ];
 
  const filtInv = inv.filter(i=>(catF==="Totes"||i.cat===catF)&&(!searchQ||i.nom.toLowerCase().includes(searchQ.toLowerCase())));
  const avail   = inv.reduce((a,i)=>a+i.disp,0);
  const total   = inv.reduce((a,i)=>a+i.total,0);
  const lowStock= inv.filter(i=>pct(i.disp,i.total)<=25).length;
  const actBkgs = bkgs.filter(b=>b.estat==="activa"||b.estat==="confirmada").length;
 
  const sendAvis = () => {
    if(!avisIn.trim()) return;
    setAvisos(av=>[{id:Date.now(),tipus:avisTip,text:avisIn.trim(),autor:user.nom,servei:avisServ,temps:"ara mateix"},...av]);
    setAvisIn(""); notify("Avís enviat");
  };
 
  const exportCSV = () => {
    const rows=[["Treballador","Equip","H. contractades","H. fetes","Diferència"],...WORKERS_DEF.filter(w=>w.rol==="treballador").map(w=>{
      const nomReal = wNom(w.id);
      const hF=Math.round(calcH(TORNS_DATA[w.id]||[])*10)/10;
      const diff=Math.round((hF-(w.hores||0))*10)/10;
      return[nomReal,w.equip==="fix"?"Equip fix":"Borsa",w.hores||0,hF,(diff>=0?"+":"")+diff];
    })];
    const csv=rows.map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download="hores_setmana_brmcv.csv";a.click();
    notify("CSV descarregat — obre'l amb Excel");
  };
 
  // Obre modal edició noms
  const openNoms = () => {
    const init = {};
    WORKERS_DEF.forEach(w=>{ init[w.id] = customNames[w.id] || w.nom; });
    setNomsEdit(init);
    setShowNoms(true);
  };
  const saveNoms = () => {
    const next = {...customNames};
    WORKERS_DEF.forEach(w=>{ if(nomsEdit[w.id]?.trim()) next[w.id] = nomsEdit[w.id].trim(); });
    setCustomNames(next);
    saveNames(next);
    // Actualitza el nom de l'usuari actiu si s'ha canviat
    if(next[user.id]) setUser(u=>({...u, nom:next[u.id]}));
    setShowNoms(false);
    notify("Noms actualitzats");
  };
 
  return(
    <div style={{minHeight:"100vh",background:"#f5f5f4",fontFamily:"system-ui,-apple-system,sans-serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0} input,select,textarea{font-family:inherit} button{cursor:pointer} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px} tr:hover td{background:#faf9f8!important} input:focus,select:focus,textarea:focus{outline:2px solid #C0392B;outline-offset:1px}`}</style>
 
      {/* HEADER */}
      <header style={{background:"#C0392B",padding:"0 16px",display:"flex",alignItems:"center",gap:12,height:54,position:"sticky",top:0,zIndex:100}}>
        <div style={{width:30,height:30,background:"rgba(255,255,255,.2)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0}}>B</div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:"#fff",lineHeight:1.2}}>Banc de Recursos Mancomunats</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.7)"}}>Carrer Tàpies, 6 · Ciutat Vella</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          {lowStock>0&&<div style={{background:"rgba(0,0,0,.2)",borderRadius:16,padding:"3px 9px",fontSize:11,color:"#fca5a5",fontWeight:600}}>⚠ {lowStock} estoc baix</div>}
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"3px 10px",fontSize:11,color:"#fff"}}>{user.nom}</div>
          {canEdit&&<button onClick={openNoms} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,padding:"4px 8px",color:"rgba(255,255,255,.8)",fontSize:11}} title="Editar noms dels treballadors">✏ Noms</button>}
          <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:6,padding:"4px 8px",color:"rgba(255,255,255,.8)",fontSize:11}}>Canviar</button>
        </div>
      </header>
 
      {/* NAV */}
      <nav style={{background:"#fff",borderBottom:"1px solid #e5e7eb",display:"flex",overflowX:"auto",padding:"0 8px"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"11px 13px",border:"none",background:"transparent",fontFamily:"inherit",fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?"#C0392B":"#6b7280",borderBottom:`2px solid ${tab===t.id?"#C0392B":"transparent"}`,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
 
      {notifState&&<Notif msg={notifState.msg} type={notifState.type}/>}
 
      <main style={{maxWidth:1020,margin:"0 auto",padding:16}}>
 
        {/* ── RESUM ── */}
        {tab==="resum"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:3}}>Bon dia, {user.nom.split(" ")[0]}!</h1>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Dimarts, 16 de juny de 2026</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
              {[{l:"Materials",v:inv.length,s:`${total} unitats`,c:"#C0392B"},{l:"Disponibles",v:avail,s:`de ${total}`,c:"#2563eb"},{l:"Reserves actives",v:actBkgs,s:`${bkgs.filter(b=>b.estat==="pendent").length} pendents`,c:"#7c3aed"},{l:"Estoc baix ⚠",v:lowStock,s:"Requereixen atenció",c:"#d97706"}].map(s=>(
                <div key={s.l} style={{background:"#fff",borderRadius:12,padding:"13px 15px",borderLeft:`3px solid ${s.c}`,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{s.l}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{s.s}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                <h2 style={{fontSize:13,fontWeight:700,marginBottom:12}}>Estoc per categoria</h2>
                {["Mobiliari","Infraestructura","Equip de so","Equip de llums","Altres"].map(cat=>{
                  const its=inv.filter(i=>i.cat===cat);
                  const t2=its.reduce((a,i)=>a+i.total,0),d2=its.reduce((a,i)=>a+i.disp,0);
                  return(<div key={cat} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{fontWeight:600}}>{cat}</span><span style={{color:"#6b7280"}}>{d2}/{t2}</span></div>
                    <div style={{height:6,background:"#f3f4f6",borderRadius:3,overflow:"hidden"}}><div style={{width:`${t2?pct(d2,t2):0}%`,height:"100%",background:sColor(d2,t2),borderRadius:3}}/></div>
                  </div>);
                })}
              </div>
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                <h2 style={{fontSize:13,fontWeight:700,marginBottom:12}}>Últims avisos</h2>
                {avisos.slice(0,4).map(a=>(
                  <div key={a.id} style={{display:"flex",gap:9,padding:"7px 0",borderBottom:"1px solid #f3f4f6"}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:avisColors[a.tipus]||"#888",marginTop:5,flexShrink:0}}/>
                    <div><div style={{fontSize:12,lineHeight:1.5}}>{a.text}</div><div style={{fontSize:11,color:"#9ca3af"}}>{a.autor} · {a.temps}</div></div>
                  </div>
                ))}
                <button onClick={()=>setTab("avisos")} style={{marginTop:10,background:"none",border:"none",color:"#C0392B",fontSize:12,fontWeight:600,padding:0}}>Veure tots →</button>
              </div>
            </div>
          </div>
        )}
 
        {/* ── INVENTARI ── */}
        {tab==="inventari"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>Inventari</h1><p style={{fontSize:13,color:"#6b7280"}}>Qualsevol treballador pot actualitzar l'estoc</p></div>
              <button onClick={()=>{setEditInv(null);setNewInv({nom:"",cat:CATS[1],total:1,disp:1,estat:"bo",ubi:"",notes:""});setShowAddInv(true)}} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:"8px 14px",fontWeight:700,fontSize:13}}>+ Afegir</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Cercar..." style={{...inputSt,flex:1,minWidth:120}}/>
              <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...inputSt,width:"auto"}}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #e5e7eb"}}>
                  {["Material","Cat.","Disponible","Estat","Ubicació",""].map(h=><th key={h} style={{padding:"9px 11px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".4px"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtInv.map(item=>(
                    <tr key={item.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                      <td style={{padding:"9px 11px"}}><div style={{fontWeight:600}}>{item.nom}</div>{item.notes&&<div style={{fontSize:11,color:"#9ca3af"}}>{item.notes}</div>}</td>
                      <td style={{padding:"9px 11px",fontSize:12,color:"#6b7280"}}>{item.cat.split(" ")[0]}</td>
                      <td style={{padding:"9px 11px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontWeight:700,color:sColor(item.disp,item.total)}}>{item.disp}</span><span style={{fontSize:11,color:"#9ca3af"}}>/{item.total}</span></div>
                        <div style={{width:48,height:4,background:"#f3f4f6",borderRadius:2,marginTop:3}}><div style={{width:`${pct(item.disp,item.total)}%`,height:"100%",background:sColor(item.disp,item.total),borderRadius:2}}/></div>
                      </td>
                      <td style={{padding:"9px 11px"}}><Badge estat={item.estat}/></td>
                      <td style={{padding:"9px 11px",fontSize:12,color:"#6b7280"}}>{item.ubi}</td>
                      <td style={{padding:"9px 11px"}}>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>{setEditInv(item);setNewInv({...item});setShowAddInv(true)}} style={{background:"#f3f4f6",border:"none",borderRadius:6,padding:"4px 9px",fontSize:11,fontWeight:600,color:"#374151"}}>Editar</button>
                          <button onClick={()=>{if(window.confirm(`Eliminar "${item.nom}"?`)){setInv(v=>v.filter(i=>i.id!==item.id));notify("Eliminat");}}} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,color:"#b91c1c"}}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
 
        {/* ── TORNS ── */}
        {tab==="torns"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:3}}>Torns setmanals</h1>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Setmana 16/6 · Juny 2026 — clica un servei per veure la fitxa</p>
            <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:540}}>
                <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #e5e7eb"}}>
                  <th style={{padding:"9px 11px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>Treballador</th>
                  <th style={{padding:"9px 6px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>Contr.</th>
                  {["Dl","Dm","Dx","Dj","Dv"].map(d=><th key={d} style={{padding:"9px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>{d}</th>)}
                  <th style={{padding:"9px 11px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>Total</th>
                </tr></thead>
                <tbody>
                  {["fix","borsa"].map(eq=>[
                    <tr key={eq}><td colSpan={8} style={{padding:"5px 11px",background:"#f9fafb",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".5px"}}>{eq==="fix"?"Equip Operatiu":"Borsa"}</td></tr>,
                    ...WORKERS_DEF.filter(w=>w.equip===eq&&w.rol==="treballador").map(w=>{
                      const torns=TORNS_DATA[w.id]||[];
                      const hF=Math.round(calcH(torns)*10)/10;
                      const diff=Math.round((hF-(w.hores||0))*10)/10;
                      const isMe=user.id===w.id;
                      const nomMostrat = wNom(w.id);
                      return(
                        <tr key={w.id} style={{borderBottom:"1px solid #f3f4f6",background:isMe?"#eff6ff":"transparent"}}>
                          <td style={{padding:"8px 11px",fontWeight:isMe?700:500,color:"#1a1a1a"}}>
                            {nomMostrat}{isMe&&<span style={{fontSize:10,color:"#2563eb",marginLeft:5,fontWeight:700,background:"#dbeafe",borderRadius:4,padding:"1px 5px"}}>(tu)</span>}
                          </td>
                          <td style={{padding:"8px 6px",textAlign:"center",color:"#6b7280",fontSize:12}}>{w.hores||"—"}</td>
                          {torns.map((t,i)=>(
                            <td key={i} style={{padding:"5px 3px",textAlign:"center"}}>
                              {t.e
                                ?<div>
                                  <div style={{background:"#dcfce7",color:"#15803d",borderRadius:4,padding:"2px 4px",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{t.e}–{t.s}</div>
                                  {t.srv&&(
                                    <button
                                      onClick={()=>{ setSelServ(normSrvId(t.srv)); setTab("serveis"); }}
                                      style={{fontSize:9,color:"#C0392B",background:"none",border:"none",padding:0,cursor:"pointer",marginTop:1,textDecoration:"underline",fontWeight:600}}
                                    >{t.srv}</button>
                                  )}
                                </div>
                                :<span style={{color:"#d1d5db",fontSize:11}}>—</span>}
                            </td>
                          ))}
                          <td style={{padding:"8px 11px",textAlign:"center"}}>
                            <div style={{fontWeight:700}}>{hF}h</div>
                            {w.hores>0&&<div style={{fontSize:10,color:diff>=0?"#15803d":"#dc2626"}}>{diff>=0?"+":""}{diff}h</div>}
                          </td>
                        </tr>
                      );
                    })
                  ])}
                </tbody>
              </table>
            </div>
            <p style={{fontSize:12,color:"#9ca3af",marginTop:8}}>La teva fila apareix ressaltada en blau. Clica el nom d'un servei (en vermell) per veure la fitxa completa.</p>
          </div>
        )}
 
        {/* ── SERVEIS ── */}
        {tab==="serveis"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:3}}>Fitxes de serveis</h1>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:14}}>{canEdit?"Pots editar qualsevol camp directament.":"Consulta la informació de cada servei."}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
              {servs.map(s=>(
                <button key={s.id} onClick={()=>setSelServ(s.id===selServ?null:s.id)}
                  style={{padding:14,border:`${s.id===selServ?"2px":"1px"} solid ${s.id===selServ?s.color:"#e5e7eb"}`,borderRadius:12,background:"#fff",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:s.color,marginBottom:8}}/>
                  <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>{s.nom}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{s.adresa.split(",")[0]}</div>
                </button>
              ))}
            </div>
            {selServ&&(()=>{
              const s=servs.find(x=>x.id===selServ);
              if(!s) return null;
              const field=(key,label,multi)=>(
                <div key={key}>
                  <label style={labelSt}>{label}</label>
                  {canEdit
                    ? multi
                      ? <textarea rows={2} value={s[key]} onChange={e=>setServs(sv=>sv.map(x=>x.id===s.id?{...x,[key]:e.target.value}:x))} style={{...inputSt,resize:"vertical",minHeight:60}}/>
                      : <input value={s[key]} onChange={e=>setServs(sv=>sv.map(x=>x.id===s.id?{...x,[key]:e.target.value}:x))} style={inputSt}/>
                    : <div style={{fontSize:13,color:"#374151",padding:"6px 0",lineHeight:1.5}}>{s[key]||"—"}</div>}
                </div>
              );
              return(
                <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",border:`1.5px solid ${s.color}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                    <div style={{width:12,height:12,borderRadius:"50%",background:s.color}}/>
                    <h2 style={{fontSize:17,fontWeight:700,color:"#1a1a1a"}}>{s.nom}</h2>
                    {canEdit&&<span style={{marginLeft:"auto",fontSize:11,color:"#9ca3af"}}>✓ S'edita automàticament</span>}
                    {!canEdit&&<span style={{marginLeft:"auto",fontSize:11,color:"#9ca3af",background:"#f3f4f6",borderRadius:4,padding:"2px 7px"}}>Només lectura</span>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    {field("adresa","Adreça")}
                    {field("horari","Horari habitual")}
                    {field("contacte","Contacte")}
                    {field("materials","Materials habituals")}
                  </div>
                  {field("instruccions","Instruccions de muntatge / accés",true)}
                  <div style={{marginTop:12}}>{field("notes","Notes addicionals",true)}</div>
                </div>
              );
            })()}
            {!selServ&&<div style={{padding:24,textAlign:"center",color:"#9ca3af",fontSize:13,border:"1px dashed #e5e7eb",borderRadius:12}}>Selecciona un servei per veure la fitxa completa</div>}
          </div>
        )}
 
        {/* ── PEDIMENTS ── */}
        {tab==="pediments"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:2}}>Pediments</h1><p style={{fontSize:13,color:"#6b7280"}}>{bkgs.length} reserves</p></div>
              <button onClick={()=>{setNewBkg({entitat:"",material:inv[0]?.nom||"",qty:1,ini:"",fi:"",contacte:"",tel:""});setShowAddBkg(true)}} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:"8px 14px",fontWeight:700,fontSize:13}}>+ Nou</button>
            </div>
            <div style={{display:"grid",gap:10}}>
              {bkgs.map(b=>(
                <div key={b.id} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"center"}}>
                    <div><div style={{fontSize:10,color:"#9ca3af",textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Entitat</div><div style={{fontWeight:700,fontSize:13}}>{b.entitat}</div><div style={{fontSize:11,color:"#6b7280"}}>{b.contacte} · {b.tel}</div></div>
                    <div><div style={{fontSize:10,color:"#9ca3af",textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Material</div><div style={{fontWeight:600,fontSize:13}}>{b.material}</div><div style={{fontSize:11,color:"#6b7280"}}>×{b.qty}</div></div>
                    <div><div style={{fontSize:10,color:"#9ca3af",textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Dates</div><div style={{fontWeight:600,fontSize:13}}>{b.ini} – {b.fi}</div></div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                      <Badge estat={b.estat}/>
                      <div style={{display:"flex",gap:5}}>
                        {b.estat==="pendent"&&<button onClick={()=>{setBkgs(v=>v.map(x=>x.id===b.id?{...x,estat:"confirmada"}:x));notify("Confirmat");}} style={{background:"#dcfce7",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#15803d"}}>Confirmar</button>}
                        {(b.estat==="confirmada"||b.estat==="activa")&&<button onClick={()=>{setBkgs(v=>v.map(x=>x.id===b.id?{...x,estat:"completada"}:x));notify("Completat");}} style={{background:"#dbeafe",border:"none",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:700,color:"#1d4ed8"}}>Completar</button>}
                        <button onClick={()=>{if(window.confirm("Eliminar?")){setBkgs(v=>v.filter(x=>x.id!==b.id));notify("Eliminat");}}} style={{background:"#fee2e2",border:"none",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,color:"#b91c1c"}}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* ── AVISOS ── */}
        {tab==="avisos"&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:3}}>Tauler d'avisos</h1>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Comunicació interna de l'equip</p>
            <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
              <h2 style={{fontSize:13,fontWeight:700,marginBottom:10}}>Enviar avís — {user.nom}</h2>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <select value={avisTip} onChange={e=>setAvisTip(e.target.value)} style={{...inputSt,width:"auto"}}>
                  <option value="info">Avís general</option><option value="ok">Servei completat</option><option value="warn">Incidència</option><option value="urgent">Urgent</option>
                </select>
                <select value={avisServ} onChange={e=>setAvisServ(e.target.value)} style={{...inputSt,width:"auto"}}>
                  {["General","GREC","ESPORT3","APC","SANT LLUC","COOP57"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={avisIn} onChange={e=>setAvisIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAvis()} placeholder="Escriu el missatge aquí..." style={{...inputSt,flex:1}}/>
                <button onClick={sendAvis} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>Enviar</button>
              </div>
            </div>
            <div style={{display:"grid",gap:10}}>
              {avisos.map(a=>(
                <div key={a.id} style={{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:avisColors[a.tipus]||"#888",marginTop:5,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                      <span style={{background:avisColors[a.tipus]+"22",color:avisColors[a.tipus],borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>{avisLabels[a.tipus]}</span>
                      <span style={{background:"#f3f4f6",color:"#6b7280",borderRadius:4,padding:"1px 7px",fontSize:10}}>{a.servei}</span>
                      <span style={{fontSize:11,color:"#9ca3af"}}>{a.temps}</span>
                    </div>
                    <div style={{fontSize:13,lineHeight:1.5}}>{a.text}</div>
                    <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>{a.autor}</div>
                  </div>
                  <button onClick={()=>{setAvisos(v=>v.filter(x=>x.id!==a.id));notify("Eliminat");}} style={{background:"none",border:"none",color:"#d1d5db",fontSize:14,cursor:"pointer",flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* ── OFICINA ── */}
        {tab==="oficina"&&canEdit&&(
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#1a1a1a",marginBottom:3}}>Panel d'oficina</h1>
            <p style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Resum d'hores i exportació per a pagaments</p>
            <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,0.06)",marginBottom:14}}>
              <h2 style={{fontSize:13,fontWeight:700,marginBottom:14}}>Hores treballades — setmana actual</h2>
              {/* Capçalera */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,padding:"5px 0",borderBottom:"2px solid #e5e7eb",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"}}>Treballador</span>
                <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",textAlign:"center"}}>Contr.</span>
                <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",textAlign:"center"}}>Fetes</span>
                <span style={{fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",textAlign:"center"}}>Diferència</span>
              </div>
              {WORKERS_DEF.filter(w=>w.rol==="treballador").map(w=>{
                const nomMostrat = wNom(w.id);
                const hF=Math.round(calcH(TORNS_DATA[w.id]||[])*10)/10;
                const diff=Math.round((hF-(w.hores||0))*10)/10;
                const isOver = diff > 0;
                const isUnder = diff < 0 && w.hores > 0;
                return(
                  <div key={w.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f3f4f6"}}>
                    <div>
                      <span style={{fontWeight:600,fontSize:13}}>{nomMostrat}</span>
                      <span style={{fontSize:11,color:"#9ca3af",marginLeft:6}}>{w.equip==="fix"?"Equip fix":"Borsa"}</span>
                    </div>
                    <div style={{textAlign:"center",fontSize:13,color:"#6b7280"}}>{w.hores||"—"}</div>
                    <div style={{textAlign:"center",fontWeight:700,fontSize:13}}>{hF}h</div>
                    <div style={{textAlign:"center"}}>
                      {w.hores>0
                        ? <span style={{fontSize:12,fontWeight:700,color:isOver?"#15803d":isUnder?"#dc2626":"#6b7280",background:isOver?"#dcfce7":isUnder?"#fee2e2":"#f3f4f6",borderRadius:6,padding:"2px 8px"}}>
                            {diff>=0?"+":""}{diff}h
                          </span>
                        : <span style={{color:"#d1d5db",fontSize:12}}>—</span>}
                    </div>
                  </div>
                );
              })}
              {/* Totals */}
              {(()=>{
                const trebs = WORKERS_DEF.filter(w=>w.rol==="treballador");
                const totContr = trebs.reduce((a,w)=>a+(w.hores||0),0);
                const totFetes = Math.round(trebs.reduce((a,w)=>a+calcH(TORNS_DATA[w.id]||[]),0)*10)/10;
                const totDiff  = Math.round((totFetes-totContr)*10)/10;
                return(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 90px",gap:8,alignItems:"center",padding:"10px 0",marginTop:4,borderTop:"2px solid #e5e7eb"}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#374151"}}>TOTAL EQUIP</span>
                    <span style={{textAlign:"center",fontSize:13,fontWeight:700}}>{totContr}h</span>
                    <span style={{textAlign:"center",fontSize:13,fontWeight:700}}>{totFetes}h</span>
                    <span style={{textAlign:"center",fontSize:12,fontWeight:700,color:totDiff>=0?"#15803d":"#dc2626"}}>{totDiff>=0?"+":""}{totDiff}h</span>
                  </div>
                );
              })()}
              <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid #f3f4f6",display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={exportCSV} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontWeight:700,fontSize:13}}>⬇ Descarregar CSV</button>
              </div>
            </div>
          </div>
        )}
 
      </main>
 
      {/* MODAL INVENTARI */}
      {showAddInv&&(
        <Modal title={editInv?"Editar material":"Nou material"} onClose={()=>{setShowAddInv(false);setEditInv(null);}}>
          <div style={{display:"grid",gap:12}}>
            <div><label style={labelSt}>Nom del material</label><input style={inputSt} value={newInv.nom} onChange={e=>setNewInv(p=>({...p,nom:e.target.value}))}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelSt}>Categoria</label><select style={inputSt} value={newInv.cat} onChange={e=>setNewInv(p=>({...p,cat:e.target.value}))}>{CATS.slice(1).map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={labelSt}>Estat</label><select style={inputSt} value={newInv.estat} onChange={e=>setNewInv(p=>({...p,estat:e.target.value}))}><option value="bo">Bo</option><option value="manteniment">Manteniment</option><option value="baixa">Baixa</option></select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelSt}>Total unitats</label><input type="number" style={inputSt} min={0} value={newInv.total} onChange={e=>setNewInv(p=>({...p,total:+e.target.value}))}/></div>
              <div><label style={labelSt}>Disponibles</label><input type="number" style={inputSt} min={0} value={newInv.disp} onChange={e=>setNewInv(p=>({...p,disp:+e.target.value}))}/></div>
            </div>
            <div><label style={labelSt}>Ubicació</label><input style={inputSt} value={newInv.ubi} onChange={e=>setNewInv(p=>({...p,ubi:e.target.value}))} placeholder="Magatzem A, Sala tècnica..."/></div>
            <div><label style={labelSt}>Notes</label><textarea style={{...inputSt,resize:"vertical",minHeight:60}} value={newInv.notes} onChange={e=>setNewInv(p=>({...p,notes:e.target.value}))}/></div>
            <button onClick={()=>{
              if(!newInv.nom) return;
              if(editInv){setInv(v=>v.map(i=>i.id===editInv.id?{...i,...newInv}:i));notify("Material actualitzat");}
              else{setInv(v=>[...v,{...newInv,id:Date.now()}]);notify("Material afegit");}
              setShowAddInv(false);setEditInv(null);
            }} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14,marginTop:4}}>
              {editInv?"Actualitzar":"Afegir material"}
            </button>
          </div>
        </Modal>
      )}
 
      {/* MODAL PEDIMENT */}
      {showAddBkg&&(
        <Modal title="Nou pediment" onClose={()=>setShowAddBkg(false)}>
          <div style={{display:"grid",gap:12}}>
            <div><label style={labelSt}>Entitat</label><input style={inputSt} value={newBkg.entitat} onChange={e=>setNewBkg(p=>({...p,entitat:e.target.value}))} placeholder="Nom de l'entitat"/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10}}>
              <div><label style={labelSt}>Material</label><select style={inputSt} value={newBkg.material} onChange={e=>setNewBkg(p=>({...p,material:e.target.value}))}>{inv.map(i=><option key={i.id}>{i.nom}</option>)}</select></div>
              <div style={{width:80}}><label style={labelSt}>Quantitat</label><input type="number" style={inputSt} min={1} value={newBkg.qty} onChange={e=>setNewBkg(p=>({...p,qty:+e.target.value}))}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelSt}>Data inici</label><input type="date" style={inputSt} value={newBkg.ini} onChange={e=>setNewBkg(p=>({...p,ini:e.target.value}))}/></div>
              <div><label style={labelSt}>Data fi</label><input type="date" style={inputSt} value={newBkg.fi} onChange={e=>setNewBkg(p=>({...p,fi:e.target.value}))}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={labelSt}>Contacte</label><input style={inputSt} value={newBkg.contacte} onChange={e=>setNewBkg(p=>({...p,contacte:e.target.value}))}/></div>
              <div><label style={labelSt}>Telèfon</label><input style={inputSt} value={newBkg.tel} onChange={e=>setNewBkg(p=>({...p,tel:e.target.value}))}/></div>
            </div>
            <button onClick={()=>{
              if(!newBkg.entitat||!newBkg.ini) return;
              setBkgs(v=>[...v,{...newBkg,id:Date.now(),estat:"pendent"}]);
              notify("Pediment creat");setShowAddBkg(false);
            }} style={{background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14,marginTop:4}}>
              Crear pediment
            </button>
          </div>
        </Modal>
      )}
 
      {/* MODAL EDICIÓ DE NOMS (admin/oficina) */}
      {showNoms&&(
        <Modal title="Editar noms dels treballadors" onClose={()=>setShowNoms(false)}>
          <p style={{fontSize:12,color:"#9ca3af",marginBottom:14}}>Els noms es guarden al navegador d'aquest dispositiu.</p>
          <div style={{display:"grid",gap:10}}>
            {WORKERS_DEF.map(w=>(
              <div key={w.id} style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:8,alignItems:"center"}}>
                <label style={{...labelSt,marginBottom:0,fontSize:10}}>{w.nom}</label>
                <input
                  style={{...inputSt,fontSize:13}}
                  value={nomsEdit[w.id]||""}
                  placeholder={w.nom}
                  onChange={e=>setNomsEdit(p=>({...p,[w.id]:e.target.value}))}
                />
              </div>
            ))}
          </div>
          <button onClick={saveNoms} style={{width:"100%",marginTop:16,background:"#C0392B",color:"#fff",border:"none",borderRadius:9,padding:12,fontWeight:700,fontSize:14}}>
            Desar noms
          </button>
        </Modal>
      )}
 
    </div>
  );
}
 
