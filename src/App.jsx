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