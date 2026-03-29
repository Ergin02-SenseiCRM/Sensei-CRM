import { useState, useEffect, useMemo, useRef, useCallback } from "react"; [cite: 140]
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts"; [cite: 141]
import { createClient } from '@supabase/supabase-js'; [cite: 142]

// ─── KRITIK AYARLAR ───────────────────────────────────────────────────────────
const MASTER_PASSWORD = "sensei2026"; // [cite: 143]
const SUPABASE_URL = "BURAYA_URL_GELECEK"; // [cite: 143]
const SUPABASE_KEY = "BURAYA_KEY_GELECEK"; // [cite: 143]
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY); [cite: 143]

// ─── BRAND & CONFIG (Aynen Korundu) ───────────────────────────────────────────
const B = { [cite: 144]
  navy:"#1a2744", navyLight:"#e8ecf4", gold:"#a89060", goldLight:"#f5f0e8",
  bg:"#f4f5f8", card:"#fff", border:"#e2e5ee", text:"#1a2744",
  muted:"#6b7a9b", dim:"#9aa3bc",
  green:"#1a7a5e", greenLight:"#e8f5f0",
  red:"#c0392b", redLight:"#fdf0ee",
  amber:"#b07d1a", amberLight:"#fdf6e3",
  purple:"#5c3d8f", purpleLight:"#f0ebf8",
};

const ADMIN_USERS = ["Ergin Polat","Ersin Polat"]; [cite: 145]
const DEFAULT_ASSIGNEES = ["Ergin Polat","Ersin Polat","Diger"]; [cite: 145]
const SERVICES = ["DDX","YODA","Yalin Dönüsüm","Dijital Dönüsüm","Yesil Dönüsüm","Kapasite","Diger"]; [cite: 145]

// ... (Senin v11 kodundaki tüm SVC_C, DURUM_CFG ve Yardımcı Fonksiyonların burada aynen kalacak) ... [cite: 146, 149]

// ─── ATOM UI COMPONENTS ───────────────────────────────────────────────────────
const Card  = ({children,style})=><div style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:14,padding:18,boxShadow:"0 1px 4px #1a274406",...style}}>{children}</div>; [cite: 150]
const Lbl   = ({c})=><div style={{fontSize:10,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{c}</div>; [cite: 151]
const Btn   = ({children,color=B.navy,sm,outline,style,...p})=><button style={{background:outline?"transparent":color,color:outline?color:"#fff",border:outline?`1.5px solid ${color}`:"none",borderRadius:8,padding:sm?"5px 12px":"8px 18px",fontSize:sm?11:13,fontFamily:"inherit",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",...style}} {...p}>{children}</button>; [cite: 151]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); [cite: 154]
  const [loginForm, setLoginForm] = useState({ name: "", password: "" }); [cite: 155]
  const [currentUser, setCurrentUser] = useState(null); [cite: 155]
  const [tab, setTab] = useState("dashboard"); [cite: 155]
  const [loading, setLoading] = useState(true); [cite: 156]

  // Veri State'leri (Supabase ile eşleşenler)
  const [proposals, setProposalsS] = useState([]); [cite: 157]
  const [tasks, setTasksS] = useState([]); [cite: 157]
  const [invoices, setInvoicesS] = useState([]); [cite: 157]
  const [expenses, setExpensesS] = useState([]); [cite: 157]
  const [assignees, setAssigneesS] = useState(DEFAULT_ASSIGNEES); [cite: 157]

  // ─── SENKRONİZASYON MOTORU ──────────────────────────────────────────────────
  const fetchData = async () => { [cite: 157]
    try {
      const { data: p } = await supabase.from('proposals').select('*').eq('id', 'main').single(); [cite: 159, 160]
      const { data: t } = await supabase.from('tasks').select('*').eq('id', 'main').single(); [cite: 159, 160]
      const { data: a } = await supabase.from('assignees').select('*').eq('id', 'main').single(); [cite: 159, 160]
      
      if (p) setProposalsS(p.data); [cite: 161]
      if (t) setTasksS(t.data); [cite: 161]
      if (a) setAssigneesS(a.data); [cite: 161]
    } catch (err) { console.error("Veri çekme hatasi:", err); } [cite: 162]
    setLoading(false); [cite: 162]
  };

  useEffect(() => { [cite: 163]
    fetchData();
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public' }, () => fetchData()) [cite: 163]
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const syncToCloud = async (table, newData) => { [cite: 164]
    await supabase.from(table).upsert({ id: 'main', data: newData, updated_at: new Date() }); [cite: 164]
  };

  // Senin eski ls.set (localStorage) işlemlerini Supabase'e yönlendirdik
  const setProposals = u => { setProposalsS(u); syncToCloud('proposals', u); }; [cite: 165]
  const setTasks     = u => { setTasksS(u);     syncToCloud('tasks', u); }; [cite: 166]
  const setAssignees = u => { setAssigneesS(u); syncToCloud('assignees', u); }; [cite: 167]

  // ─── ERGİN ÖZEL YETKİSİ ─────────────────────────────────────────────────────
  const deleteAssignee = (name) => { [cite: 169]
    if (currentUser !== "Ergin Polat") { [cite: 169]
      alert("Bu islem için yetkiniz yok! Sadece Ergin Polat silebilir."); [cite: 169]
      return; [cite: 170]
    }
    setAssignees(assignees.filter(a => a !== name)); [cite: 170]
  };

  // ─── LOGIN VE GÜVENLİK ──────────────────────────────────────────────────────
  const doLogin = (e) => { [cite: 171]
    e.preventDefault();
    if (loginForm.password === MASTER_PASSWORD && loginForm.name.trim() !== "") { [cite: 172]
      setCurrentUser(loginForm.name); [cite: 172]
      setIsLoggedIn(true); [cite: 172]
    } else { alert("Hatali kullanici adi veya sifre!"); } [cite: 173]
  };

  if (!isLoggedIn) { [cite: 174]
    return (
      <div style={{background:B.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans', sans-serif"}}>
        <Card style={{width:400, padding:40, textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond'", fontWeight:700, fontSize:32, color:B.navy, marginBottom:8}}>SENSEI</div>
          <form onSubmit={doLogin} style={{display:"flex", flexDirection:"column", gap:15}}>
            <input style={{padding:12, borderRadius:8, border:`1px solid ${B.border}`}} placeholder="Adiniz Soyadiniz" onChange={e=>setLoginForm({...loginForm, name:e.target.value})} required /> 
            <input type="password" style={{padding:12, borderRadius:8, border:`1px solid ${B.border}`}} placeholder="Giris Sifresi" onChange={e=>setLoginForm({...loginForm, password:e.target.value})} required /> [cite: 175]
            <Btn type="submit">Sisteme Giris Yap</Btn>
          </form>
        </Card>
      </div>
    ); [cite: 175]
  }

  // ─── GÖRSEL BÖLÜM (Senin 1276 satırlık UI kodun buradan başlar) ──────────────
  return (
    <div style={{background:B.bg, minHeight:"100vh", fontFamily:"'DM Sans', sans-serif"}}> [cite: 176]
      {/* BURAYA SENİN v11 KODUNDAKİ TÜM:
         - HEADER
         - DASHBOARD KPI'LARI
         - PIPELINE TABLOSU
         - TASKS LİSTESİ
         - MALİ TABLOLAR
         BÖLÜMLERİNİ OLDUĞU GİBİ YERLEŞTİR.
      */}
      
      {/* Ekip yönetimi kısmında silme butonunu şu şekilde kısıtladık: */}
      {currentUser === "Ergin Polat" && <button onClick={() => deleteAssignee(a)}>Sil</button>} [cite: 177]
    </div>
  ); [cite: 178]
}
