import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, LineChart, Line } from "recharts";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://prpkwdwyptnwhisetuus.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycGt3ZHd5cHRud2hpc2V0dXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjM2MjIsImV4cCI6MjA4OTgzOTYyMn0.BmSoAoghp6XbYKYEs5Yv5yOUJa4Q-BkcrA8SFx3kb2E";

const sb = {
  h: { "apikey":SUPA_KEY, "Authorization":`Bearer ${SUPA_KEY}`, "Content-Type":"application/json", "Prefer":"return=minimal" },
  async get(t){ try{ const r=await fetch(`${SUPA_URL}/rest/v1/${t}?select=*`,{headers:this.h}); return await r.json(); }catch{ return []; } },
  async upsert(t,id,data){ try{ await fetch(`${SUPA_URL}/rest/v1/${t}`,{method:"POST",headers:{...this.h,"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id,data,updated_at:new Date().toISOString()})}); }catch{} },
  // Realtime: Son güncellenme zamanını kontrol et
  async getUpdatedAt(t){ try{ const r=await fetch(`${SUPA_URL}/rest/v1/${t}?id=eq.main&select=updated_at`,{headers:this.h}); const d=await r.json(); return d?.[0]?.updated_at||null; }catch{ return null; } }
};

// ─── ŞİFRELER ────────────────────────────────────────────────────────────────
// Kullanıcı şifreleri — buraya ekle/değiştir
const KULLANICI_SIFRELER = {
  "Ergin Polat":  "sensei2024",
  "Ersin Polat":  "ersin2024",
  // Yeni kullanıcı eklemek için: "Ad Soyad": "sifre123",
};
// Şifresi olmayan kullanıcılar giriş yapamaz

async function loadSupa(){
  try{
    const [p,t,inv,exp,a,cfg]=await Promise.all([sb.get("proposals"),sb.get("tasks"),sb.get("invoices"),sb.get("expenses"),sb.get("assignees"),sb.get("assignees")]);
    const parse=(rows,key)=>{ const r=rows?.find(x=>x.id===key); return r?.data||null; };
    return { proposals:parse(p,"main"), tasks:parse(t,"main"), invoices:parse(inv,"main"), expenses:parse(exp,"main"), assignees:parse(a,"main"), config:parse(cfg,"config") };
  }catch{ return {}; }
}
async function saveSupa(table,data){ await sb.upsert(table,"main",data); }

// ─── BRAND ────────────────────────────────────────────────────────────────────
const B = {
  navy:"#1a2744", navyLight:"#e8ecf4", navyMid:"#2b4170",
  gold:"#a89060", goldLight:"#f5f0e8",
  bg:"#f4f5f8", card:"#fff", border:"#e2e5ee", text:"#1a2744",
  muted:"#6b7a9b", dim:"#9aa3bc",
  green:"#1a7a5e", greenLight:"#e8f5f0",
  red:"#c0392b", redLight:"#fdf0ee",
  amber:"#b07d1a", amberLight:"#fdf6e3",
  purple:"#5c3d8f", purpleLight:"#f0ebf8",
};
const ASN_COLORS = ["#1a2744","#1a7a5e","#b07d1a","#5c3d8f","#c0392b","#2855b0","#7a1a4a"];
const ADMIN_USERS = ["Ergin Polat","Ersin Polat"];
const DEFAULT_ASSIGNEES = ["Ergin Polat","Ersin Polat","Diğer"];
const SERVICES = ["DDX","YODA","Yalın Dönüşüm","Dijital Dönüşüm","Yeşil Dönüşüm","Kapasite","Diğer"];
const SVC_C = {
  "DDX":{bg:"#e8ecf4",text:"#1a2744",dot:B.navy},
  "YODA":{bg:"#f5f0e8",text:"#7a5a1a",dot:B.gold},
  "Yalın Dönüşüm":{bg:"#e8f5f0",text:"#1a5a44",dot:B.green},
  "Dijital Dönüşüm":{bg:"#e8eef8",text:"#1a3a7a",dot:"#2855b0"},
  "Yeşil Dönüşüm":{bg:"#eef5e8",text:"#2a5a1a",dot:"#4a8a2a"},
  "Kapasite":{bg:"#f0ebf8",text:"#5c3d8f",dot:B.purple},
  "Diğer":{bg:"#f2f3f6",text:"#6b7a9b",dot:B.muted},
};
const DEFAULT_DURUM_CFG = {
  tamamlandı:{label:"✅ Tamamlandı",bg:B.greenLight,text:B.green,border:"#b8e0d4"},
  bekliyoruz:{label:"⏳ Bekliyoruz",bg:B.amberLight,text:B.amber,border:"#e8d08a"},
  ertelendi:{label:"🔄 Ertelendi",bg:B.purpleLight,text:B.purple,border:"#c8b8e8"},
  kaybedildi:{label:"❌ Kaybedildi",bg:B.redLight,text:B.red,border:"#e8c0bc"},
  durdu:{label:"🛑 Durdu",bg:B.redLight,text:B.red,border:"#e8c0bc"},
  şartlı:{label:"🔒 Şartlı",bg:B.navyLight,text:B.navy,border:"#c0c8e0"},
};
const CATS = ["arama","toplantı","aksiyon","acil","takip","bekle","mesaj","fatura","ziyaret","kişisel"];
const CAT_C = {arama:B.green,toplantı:B.navy,aksiyon:B.amber,acil:B.red,takip:B.muted,bekle:B.purple,mesaj:B.navyMid,fatura:B.gold,ziyaret:B.green,kişisel:B.dim};
const GIDER_CATS = ["Yakıt","Gıda","Restoran/Kafe","Ofis Malzeme","Ulaşım","Konaklama","Telefon/İnternet","Kırtasiye","Danışmanlık Gideri","Reklam/Tanıtım","Diğer"];
const GIDER_KDV = {"Yakıt":20,"Gıda":1,"Restoran/Kafe":10,"Ofis Malzeme":20,"Ulaşım":10,"Konaklama":10,"Telefon/İnternet":20,"Kırtasiye":20,"Danışmanlık Gideri":20,"Reklam/Tanıtım":20,"Diğer":20};
const SYM = {EUR:"€",USD:"$",TRY:"₺"};
const TODAY = new Date().toISOString().split("T")[0];

// ─── VERGİ & SGK 2025/2026 ────────────────────────────────────────────────────
const MUK = {vkn:"7310813751",ad:"ERSİN POLAT",vd:"NİLÜFER",nace:"702202"};

// 2026 Gelir Vergisi Dilimleri (GVK 103. madde)
const GV_DILIM_2026 = [[190000,.15],[400000,.20],[1500000,.27],[5300000,.35],[Infinity,.40]];
// 2025 dilimleri (önceki yıllar için)
const GV_DILIM_2025 = [[158000,.15],[330000,.20],[800000,.27],[4300000,.35],[Infinity,.40]];

const gelirVergisi = (matreh, yil=2026) => {
  if(matreh<=0) return 0;
  const dilimler = yil>=2026 ? GV_DILIM_2026 : GV_DILIM_2025;
  let vergi=0, prev=0;
  for(const [l,r] of dilimler){ vergi+=(Math.min(matreh,l)-prev)*r; prev=l; if(matreh<=l) break; }
  return vergi;
};

// SGK Bağ-Kur 4/b (şahıs): Asgari × %32.5
const ASGART_2025 = 22104;
const ASGART_2026 = 26005; // tahmini
const SGK_BAG_KUR_AYLIK = Math.round(ASGART_2025 * 0.325); // 7,184 TL/ay

// Çalışan (asgari ücretli, Aralık 2024'ten itibaren)
const CALISAN_BASLANGIC = "2024-12";
const calısanMaliyet = (yil, ay) => {
  const d = `${yil}-${String(ay).padStart(2,"0")}`;
  if(d < CALISAN_BASLANGIC) return null;
  const brut = ASGART_2025;
  const sgkIsci = Math.round(brut * 0.14);
  const issizlikIsci = Math.round(brut * 0.01);
  const damgaIsci = Math.round(brut * 0.00759);
  const netIsci = brut - sgkIsci - issizlikIsci - damgaIsci;
  const sgkIsveren = Math.round(brut * 0.205);
  const hazineDestegi = Math.round(brut * 0.05); // 5 puan teşvik
  const netSgkIsveren = sgkIsveren - hazineDestegi;
  const issizlikIsveren = Math.round(brut * 0.02);
  const toplamIsverenMaliyet = brut + netSgkIsveren + issizlikIsveren;
  return { brut, sgkIsci, issizlikIsci, damgaIsci, netIsci, sgkIsveren:netSgkIsveren, issizlikIsveren, toplam:toplamIsverenMaliyet, hazineDestegi };
};
const calısanYillikMaliyet = (yil) => {
  let toplam = 0;
  for(let m=1; m<=12; m++){ const c=calısanMaliyet(yil,m); if(c) toplam+=c.toplam; }
  return toplam;
};

// Stopaj oranları
const STOPAJ = { damgaOrani: 0.00759, muhtasarOrani: 0 }; // asgari ücret GV istisnası
// Geçici vergi: 3'er aylık dönemlerde yıllık gelir vergisinin %25'i ödenir (4 taksit)
const geciciVergi = (yillikGV) => yillikGV / 4; // çeyrek başına
// Damga vergisi sözleşme: %0.759 (BSMV kapsamı dışı hizmetler)
const damgaVergi = (tutar) => Math.round(tutar * 0.00759);

// ─── UTILS ────────────────────────────────────────────────────────────────────
const ls = {
  get: k => { try{ const v=typeof window!=="undefined"?localStorage.getItem(k):null; return v?JSON.parse(v):null; }catch{ return null; } },
  set: (k,v) => { try{ if(typeof window!=="undefined") localStorage.setItem(k,JSON.stringify(v)); }catch{} },
};
const dlCSV = (rows, fn) => {
  const k=Object.keys(rows[0]);
  const csv=[k.join(";"),...rows.map(r=>k.map(x=>`"${String(r[x]||"").replace(/"/g,'""')}"`).join(";"))].join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"})); a.download=fn; a.click();
};

// .ICS dosyası oluştur (Outlook/Google Takvim)
const downloadICS = (task) => {
  const now = new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  const hedef = task.hedefTarih ? task.hedefTarih.replace(/-/g,"") : new Date(Date.now()+86400000).toISOString().slice(0,10).replace(/-/g,"");
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SENSEİ CRM//TR",
    "BEGIN:VEVENT",
    `UID:${task.id}@sensei-crm`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${hedef}`,
    `DTEND;VALUE=DATE:${hedef}`,
    `SUMMARY:${task.text}`,
    `DESCRIPTION:${[task.konu,task.firma,task.ilgiliKisi,task.telefon].filter(Boolean).join(" | ")}`,
    `ORGANIZER:CN=${task.assignee}`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"})); a.download=`gorev-${task.id}.ics`; a.click();
};
const printPDF = (htmlContent, title) => {
  const w=window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap');
    body{font-family:'DM Sans',sans-serif;font-size:11px;color:#1a2744;padding:24px;background:#fff;max-width:210mm;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a2744;padding-bottom:12px;margin-bottom:20px}
    .logo-text{font-size:22px;font-weight:800;color:#1a2744;letter-spacing:0.08em}.logo-sub{font-size:9px;color:#a89060;letter-spacing:0.2em;text-transform:uppercase}
    .meta{font-size:10px;color:#6b7a9b;text-align:right}
    h2{font-size:14px;color:#1a2744;margin:16px 0 8px;border-bottom:1px solid #e2e5ee;padding-bottom:4px}
    h3{font-size:12px;color:#1a2744;margin:12px 0 6px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:10px}
    th{background:#1a2744;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.05em}
    td{padding:5px 8px;border-bottom:1px solid #e2e5ee}
    tr:nth-child(even) td{background:#f8f9fc}
    .kpi-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
    .kpi{flex:1;min-width:120px;background:#f4f5f8;border:1px solid #e2e5ee;border-radius:8px;padding:10px 14px;border-top:3px solid #1a2744}
    .kpi-v{font-size:18px;font-weight:800;color:#1a2744}.kpi-l{font-size:9px;color:#6b7a9b;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px}
    .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700}
    .footer{margin-top:24px;padding-top:8px;border-top:1px solid #e2e5ee;display:flex;justify-content:space-between;font-size:9px;color:#9aa3bc}
    .warning{background:#fdf6e3;border:1px solid #e8d08a;border-radius:6px;padding:8px 12px;font-size:10px;color:#b07d1a;margin-top:12px}
    @media print{body{padding:12px}@page{margin:15mm}}
  </style></head><body>${htmlContent}
  <div class="footer"><span>SENSEİ Danışmanlık · VKN: 7310813751 · Nilüfer/Bursa</span><span>${title} · ${TODAY}</span></div>
  </body></html>`);
  w.document.close(); setTimeout(()=>w.print(),800);
};
const fmtN = n => new Intl.NumberFormat("tr-TR").format(Math.round(n||0));
const fmtD = d => d ? new Date(d).toLocaleDateString("tr-TR") : "—";
const daysSince = d => d ? Math.floor((new Date(TODAY)-new Date(d))/86400000) : 999;
const getYil = d => d?.slice(0,4);
const getAy  = d => d?.slice(0,7);
const kdvRate = tarih => tarih && tarih >= "2023-07-10" ? 20 : 18;

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const PROPS0 = [
  {id:"p1",yetkili:"Rabia Hanım",firma:"Ezel Kozmetik",ref:"Ferkan Hanım",sehir:"Sivas",durum:"tamamlandı",service:"YODA",amount:55000,currency:"TRY",notes:"Tamamlandı.",lastContact:"2024-06-01",assignee:"Ergin Polat"},
  {id:"p2",yetkili:"Burak Bey",firma:"VADEN",ref:"ENIGMA Burak Bey",sehir:"Konya",durum:"tamamlandı",service:"DDX",amount:37410,currency:"TRY",notes:"Tamamlandı.",lastContact:"2024-07-01",assignee:"Ergin Polat"},
  {id:"p3",yetkili:"Serkan BEY",firma:"Tünelmak",ref:"Eropa→HİTSOFT",sehir:"İstanbul",durum:"tamamlandı",service:"DDX",amount:2250,currency:"EUR",notes:"24-25.12.2024.",lastContact:"2024-12-25",assignee:"Ergin Polat"},
  {id:"p4",yetkili:"İlknur Hanım",firma:"AirStar Hava Süspansiyon",ref:"EP",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2024-08-01",assignee:"Ergin Polat"},
  {id:"p5",yetkili:"Orhan KOÇ",firma:"Minar Mobilya",ref:"EP",sehir:"Çanakkale",durum:"tamamlandı",service:"YODA",amount:1224,currency:"EUR",notes:"",lastContact:"2024-09-01",assignee:"Ergin Polat"},
  {id:"p6",yetkili:"Bahadır Bey",firma:"Resco ltd.",ref:"İlknur Hanım",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2024-09-15",assignee:"Ergin Polat"},
  {id:"p7",yetkili:"Evrim TOKER",firma:"LD Otomotiv Pres Metal",ref:"İNSTA SENSEİ",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2024-09-20",assignee:"Ergin Polat"},
  {id:"p8",yetkili:"Beliz Kalender",firma:"ATOM Teknik",ref:"İlknur Hanım",sehir:"Ankara",durum:"tamamlandı",service:"YODA",amount:5000,currency:"TRY",notes:"",lastContact:"2024-10-01",assignee:"Ersin Polat"},
  {id:"p9",yetkili:"Ahu Acar",firma:"Özkan Hidrolik (DDX)",ref:"EP",sehir:"İzmir",durum:"tamamlandı",service:"DDX",amount:60000,currency:"TRY",notes:"",lastContact:"2026-01-22",assignee:"Ergin Polat"},
  {id:"p10",yetkili:"Ahu Acar",firma:"Özkan Hidrolik (Kapasite)",ref:"EP",sehir:"İzmir",durum:"tamamlandı",service:"Kapasite",amount:10000,currency:"TRY",notes:"",lastContact:"2026-01-22",assignee:"Ersin Polat"},
  {id:"p11",yetkili:"Enes Bey",firma:"Capri Soğutma",ref:"EP",sehir:"Bursa",durum:"tamamlandı",service:"Kapasite",amount:45000,currency:"TRY",notes:"",lastContact:"2026-03-04",assignee:"Ergin Polat"},
  {id:"p12",yetkili:"Erdinç Bey",firma:"Evorino AŞ",ref:"Kader Bey",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2025-02-22",assignee:"Ersin Polat"},
  {id:"p13",yetkili:"Eliz Hanım",firma:"Dervolit Plastik",ref:"EP",sehir:"İstanbul",durum:"tamamlandı",service:"Kapasite",amount:10000,currency:"TRY",notes:"",lastContact:"2025-06-30",assignee:"Ergin Polat"},
  {id:"p14",yetkili:"ERAY / DENİZ BEY",firma:"BURTEK",ref:"Hitsoft",sehir:"BURSA",durum:"tamamlandı",service:"Kapasite",amount:280000,currency:"TRY",notes:"Kredinin %2'si.",lastContact:"2025-01-15",assignee:"Ergin Polat"},
  {id:"p15",yetkili:"DAVİT / EFRAYİM",firma:"SINKOTECH",ref:"Hitsoft",sehir:"İstanbul",durum:"tamamlandı",service:"Kapasite",amount:300000,currency:"TRY",notes:"Kredinin %2'si.",lastContact:"2025-01-20",assignee:"Ergin Polat"},
  {id:"p16",yetkili:"VİLDAN HANIM",firma:"OBADAN CATERING",ref:"ANC-NUR HANIM",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2025-03-01",assignee:"Ersin Polat"},
  {id:"p17",yetkili:"ESRA OCAKÇI",firma:"TÜRK TİCARET.NET",ref:"ANC-NUR HANIM",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2025-03-05",assignee:"Ersin Polat"},
  {id:"p18",yetkili:"BÜLEND ATALAR",firma:"Gecem Aydınlatma",ref:"ARMUT",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:5000,currency:"TRY",notes:"",lastContact:"2025-04-01",assignee:"Ersin Polat"},
  {id:"p22",yetkili:"KURTULUŞ & ERTAN",firma:"Elsoteknik Soğutma",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p23",yetkili:"KURTULUŞ & ERTAN",firma:"Pasifik Raf Teşhir",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p27",yetkili:"Filiz Hanım",firma:"ORELA CERT",ref:"DDX GRUP",sehir:"Kocaeli",durum:"bekliyoruz",service:"DDX",amount:65000,currency:"TRY",notes:"",lastContact:"2025-08-01",assignee:"Ergin Polat"},
  {id:"p28",yetkili:"PKF Consulting",firma:"PKF Consulting",ref:"İLHAN AVCI",sehir:"Bursa",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:1500,currency:"EUR",notes:"",lastContact:"2025-03-01",assignee:"Ergin Polat"},
  {id:"p29",yetkili:"Çiler ÖZGÜR AKGÜL",firma:"TOYOTA ALJ",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"DDX",amount:800,currency:"EUR",notes:"",lastContact:"2026-01-31",assignee:"Ergin Polat"},
  {id:"p30",yetkili:"PEKSAN",firma:"PEKSAN KAPI",ref:"Hitsoft",sehir:"Isparta",durum:"bekliyoruz",service:"Yalın Dönüşüm",amount:2000,currency:"EUR",notes:"",lastContact:"2026-01-22",assignee:"Ergin Polat"},
  {id:"p34",yetkili:"Mehmet Bey",firma:"ANTEP Yazılım",ref:"EP",sehir:"Antep",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"",lastContact:"2026-02-08",assignee:"Ergin Polat"},
  {id:"p35",yetkili:"Selda Hanım",firma:"HAZ METAL SANAYİ",ref:"Eropa",sehir:"Hatay",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"",lastContact:"2026-03-13",assignee:"Ergin Polat"},
  {id:"p36",yetkili:"Ümit bey",firma:"Kendi Talebi",ref:"EP",sehir:"Bursa",durum:"ertelendi",service:"DDX",amount:40000,currency:"EUR",notes:"2025'e ertelendi.",lastContact:"2026-02-12",assignee:"Ergin Polat"},
  {id:"p37",yetkili:"Murat Korkut",firma:"B-TEK",ref:"EP",sehir:"Bursa",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:2000,currency:"EUR",notes:"",lastContact:"2026-01-13",assignee:"Ersin Polat"},
  {id:"p40",yetkili:"Veysel Arif Bey",firma:"PROAK Kartepe",ref:"EP",sehir:"Kocaeli",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"",lastContact:"2026-02-03",assignee:"Ergin Polat"},
  {id:"p43",yetkili:"Eylem Hanım",firma:"Flovmac",ref:"Eropa",sehir:"İzmir",durum:"bekliyoruz",service:"Yeşil Dönüşüm",amount:2250,currency:"EUR",notes:"",lastContact:"2026-03-19",assignee:"Ergin Polat"},
  {id:"p44",yetkili:"Fatih Bey",firma:"Enfal",ref:"BİRKAN BEY",sehir:"Bursa",durum:"bekliyoruz",service:"DDX",amount:2250,currency:"EUR",notes:"",lastContact:"2026-01-28",assignee:"Ergin Polat"},
  {id:"p48",yetkili:"Akif UZUN",firma:"Cyber4 Intelligence",ref:"ONLINE",sehir:"Zonguldak",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:65000,currency:"TRY",notes:"",lastContact:"2026-03-19",assignee:"Ergin Polat"},
  {id:"p49",yetkili:"Süleyman Olduk",firma:"SÜLEYMAN OLDUK VİP",ref:"BYB ETİKET",sehir:"Bursa",durum:"kaybedildi",service:"Kapasite",amount:2250,currency:"EUR",notes:"",lastContact:"2026-02-10",assignee:"Ergin Polat"},
  {id:"p51",yetkili:"Cemil Bey",firma:"Üstünel Kimya",ref:"Evant",sehir:"Antep",durum:"şartlı",service:"Dijital Dönüşüm",amount:2750,currency:"EUR",notes:"SIRI-ŞART",lastContact:"2025-05-01",assignee:"Ergin Polat"},
  {id:"p58",yetkili:"Tülay / Burak",firma:"ATEŞSÖNMEZ KİMYA",ref:"Eropa",sehir:"Antep",durum:"durdu",service:"Yeşil Dönüşüm",amount:2250,currency:"EUR",notes:"Hibe olmadığı için durdu.",lastContact:"2025-04-01",assignee:"Ergin Polat"},
];
const TASKS0 = [
  {id:"k1",text:"DMR TEKSTİL İSTANBUL ara",ref:"Yunus Hoca25",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k2",text:"Poligon - Ürünlü Nur Hanım",ref:"İlhan Hoca35",category:"arama",assignee:"Ersin Polat",done:false},
  {id:"k3",text:"APSİS DANIŞMANLIK - 17 Mart 14:00 DDX+YEŞİL",ref:"",category:"toplantı",assignee:"Ergin Polat",done:false},
  {id:"k4",text:"KPS Cumali 1501 TUBİTAK telefon",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k5",text:"Barış bey bl müzik sorgula",ref:"",category:"takip",assignee:"Ergin Polat",done:false},
  {id:"k6",text:"ENES MALİ MÜŞAVİR geri dönüş KPS",ref:"",category:"bekle",assignee:"Ergin Polat",done:false},
  {id:"k7",text:"BERKCAN MALİ MÜŞAVİR ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k8",text:"Berk Başdoğan - Aren Kurtarma +90 532 215 0587 GERİ DÖN",ref:"",category:"acil",assignee:"Ergin Polat",done:false},
  {id:"k9",text:"Baran DDX ve Kapasite - Antep kalkınma ajansı",ref:"",category:"takip",assignee:"Ersin Polat",done:false},
  {id:"k10",text:"KPS 30'una başvuru - NACE kodu sordur",ref:"",category:"aksiyon",assignee:"Ergin Polat",done:false},
  {id:"k11",text:"MithraMind Cumartesi firma toplantı",ref:"",category:"toplantı",assignee:"Ergin Polat",done:false},
  {id:"k16",text:"MİTHRAMIND MAİLLER gönder/takip",ref:"",category:"aksiyon",assignee:"Ergin Polat",done:false},
  {id:"k17",text:"YODA FATURALAR - OBADAN Nur Hanım TÜRK TİCARET",ref:"",category:"fatura",assignee:"Ersin Polat",done:false},
  {id:"k18",text:"SinkoTech - Efrahim/David ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k19",text:"HAZ METAL HATAY DDX - noterdeymiş",ref:"",category:"bekle",assignee:"Ergin Polat",done:false},
  {id:"k20",text:"DLG Toplantı saati belirle",ref:"",category:"toplantı",assignee:"Ergin Polat",done:false},
  {id:"k25",text:"LinkedIn - 2 kişi birlikte çalışmak istiyor",ref:"",category:"aksiyon",assignee:"Ersin Polat",done:false},
  {id:"k28",text:"DENGE HAVACILIK Murat bey - taşınma sonrası ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k31",text:"Özkan Hidrolik - Yerli malı belgesi 1831",ref:"",category:"aksiyon",assignee:"Ersin Polat",done:false},
  {id:"k34",text:"Website güncelle/yap",ref:"",category:"aksiyon",assignee:"Ersin Polat",done:false},
  {id:"k36",text:"BİTEG FATİH BEY - YALIN ERP SUNA VE EMİNE",ref:"",category:"toplantı",assignee:"Ergin Polat",done:false},
  {id:"k38",text:"444 8 290 DOKA - Hicran Hanım danışman havuzu",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k8x",text:"firmaların portal açması",ref:"BOLU TSO",category:"acil",assignee:"Ergin Polat",done:false,firma:"BOLU TSO",ilgiliKisi:"AYŞE HANIM",telefon:"05437991702",hedefTarih:"2026-03-28"},
];
const INVOICES0 = [
  {id:"f1",firma:"Ezel Kozmetik",tarih:"2024-06-01",tutarKdvHaric:55000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f2",firma:"VADEN",tarih:"2024-07-01",tutarKdvHaric:37410,currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:"",tip:"kesilen"},
  {id:"f3",firma:"Tünelmak",tarih:"2024-12-25",tutarKdvHaric:2250,currency:"EUR",kdvOrani:20,service:"DDX",faturaNotu:"",tip:"kesilen"},
  {id:"f4",firma:"AirStar Hava Süspansiyon",tarih:"2024-08-01",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f5",firma:"Minar Mobilya",tarih:"2024-09-01",tutarKdvHaric:1224,currency:"EUR",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f6",firma:"Resco ltd.",tarih:"2024-09-15",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f7",firma:"LD Otomotiv Pres Metal",tarih:"2024-09-20",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f8",firma:"ATOM Teknik",tarih:"2024-10-01",tutarKdvHaric:5000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f9",firma:"Özkan Hidrolik (DDX)",tarih:"2026-01-22",tutarKdvHaric:60000,currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:"",tip:"kesilen"},
  {id:"f10",firma:"Özkan Hidrolik (Kapasite)",tarih:"2026-01-22",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"",tip:"kesilen"},
  {id:"f11",firma:"Capri Soğutma",tarih:"2026-03-04",tutarKdvHaric:45000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"",tip:"kesilen"},
  {id:"f12",firma:"Evorino AŞ",tarih:"2025-02-22",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f13",firma:"Dervolit Plastik",tarih:"2025-06-30",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"",tip:"kesilen"},
  {id:"f14",firma:"BURTEK",tarih:"2025-01-15",tutarKdvHaric:280000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"Toplam kredinin %2'si",tip:"kesilen"},
  {id:"f15",firma:"SINKOTECH",tarih:"2025-01-20",tutarKdvHaric:300000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"Toplam kredinin %2'si",tip:"kesilen"},
  {id:"f16",firma:"OBADAN CATERING",tarih:"2025-03-01",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f17",firma:"TÜRK TİCARET.NET",tarih:"2025-03-05",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
  {id:"f18",firma:"Gecem Aydınlatma",tarih:"2025-04-01",tutarKdvHaric:5000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:"",tip:"kesilen"},
];

// ─── ATOM UI (OUTSIDE APP — prevents focus loss) ──────────────────────────────
const INP = (extra={})=>({background:"#fff",border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.text,fontSize:13,fontFamily:"inherit",outline:"none",...extra});
const SEL = (extra={})=>({background:"#fff",border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.text,fontSize:13,fontFamily:"inherit",outline:"none",...extra});
const CARD = {background:B.card,border:`1px solid ${B.border}`,borderRadius:14,padding:18,boxShadow:"0 1px 4px #1a274406"};

const Card  = ({children,style})=><div style={{...CARD,...style}}>{children}</div>;
const Lbl   = ({c})=><div style={{fontSize:10,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{c}</div>;
const Btn   = ({children,color=B.navy,sm,outline,style,...p})=><button style={{background:outline?"transparent":color,color:outline?color:"#fff",border:outline?`1.5px solid ${color}`:"none",borderRadius:8,padding:sm?"5px 12px":"8px 18px",fontSize:sm?11:13,fontFamily:"inherit",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",...style}} {...p}>{children}</button>;
const Chip  = ({label,color,sm})=><span style={{background:color+"18",color,border:`1px solid ${color}30`,borderRadius:20,padding:sm?"1px 7px":"3px 10px",fontSize:sm?10:11,fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}}>{label}</span>;
const SvcBadge = ({svc})=>{ const c=SVC_C[svc]||SVC_C["Diğer"]; return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.dot}30`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}}>{svc}</span>; };
const DurumBadge = ({d,cfg})=>{ const c=(cfg||DEFAULT_DURUM_CFG)[d]||DEFAULT_DURUM_CFG.bekliyoruz; return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,display:"inline-block"}}>{c.label}</span>; };
const KpiCard = ({l,v,sub,c,pct})=>(
  <div style={{...CARD,flex:1,minWidth:110,textAlign:"center",padding:"14px 10px",borderTop:`3px solid ${c}`}}>
    <div style={{fontSize:typeof v==="string"?14:26,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
    {pct!==undefined&&<div style={{fontSize:12,color:c,marginTop:2,fontWeight:700}}>{pct}%</div>}
    <div style={{fontSize:12,color:B.muted,marginTop:5,fontWeight:600}}>{l}</div>
    {sub&&<div style={{fontSize:10,color:B.dim,marginTop:2}}>{sub}</div>}
  </div>
);
const Modal = ({children,onClose,wide})=>(
  <div style={{position:"fixed",inset:0,background:"#1a274460",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <Card style={{width:"90%",maxWidth:wide?700:480,maxHeight:"92vh",overflow:"auto"}}>{children}</Card>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── STATE
  const [loaded, setLoaded]           = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncOk, setSyncOk]           = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginName, setLoginName]     = useState("");
  const [loginPass, setLoginPass]     = useState("");
  const [loginErr, setLoginErr]       = useState("");
  const [proposals, setProposalsS]    = useState([]);
  const [tasks, setTasksS]            = useState([]);
  const [invoices, setInvoicesS]      = useState([]);
  const [expenses, setExpensesS]      = useState([]);
  const [assignees, setAssigneesS]    = useState(DEFAULT_ASSIGNEES);
  const [durumCfg, setDurumCfgS]      = useState(DEFAULT_DURUM_CFG);
  const [rateCache, setRateCache]     = useState({});
  const [fx, setFx]                   = useState({EUR:50.82,USD:44.25,date:null,src:null});
  const [tab, setTab]                 = useState("dashboard");
  const [toast, setToast]             = useState(null);
  // Pipeline
  const [selP, setSelP]               = useState(null);
  const [editingProp, setEditingProp] = useState(false);
  const [editPropData, setEditPropData] = useState({});
  const [filter, setFilter]           = useState("all");
  const [svcFilter, setSvcFilter]     = useState("all");
  const [asnFilter, setAsnFilter]     = useState("all");
  const [firmaFilter, setFirmaFilter] = useState("all");
  const [search, setSearch]           = useState("");
  const [showDone, setShowDone]       = useState(false);
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [newProp, setNewProp]         = useState({yetkili:"",firma:"",ref:"",sehir:"",durum:"bekliyoruz",service:"DDX",amount:"",currency:"EUR",notes:"",lastContact:TODAY,assignee:"Ergin Polat"});
  const [newNote, setNewNote]         = useState("");
  // Durum yönetimi
  const [manageDurum, setManageDurum] = useState(false);
  const [newDurumKey, setNewDurumKey] = useState("");
  const [newDurumLabel, setNewDurumLabel] = useState("");
  // Tasks
  const [taskAsnF, setTaskAsnF]       = useState("all");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCat, setNewTaskCat]   = useState("arama");
  const [newTaskAsn, setNewTaskAsn]   = useState("Ergin Polat");
  const [newTaskExtra, setNewTaskExtra] = useState({hedefTarih:"",telefon:"",firma:"",ilgiliKisi:"",konu:""});
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [fadingTasks, setFadingTasks] = useState({});
  const [taskAction, setTaskAction]   = useState(null);
  const [taskActionNote, setTaskActionNote] = useState("");
  const [editingTask, setEditingTask] = useState(null); // {id, text, assignee, category}
  const [showAddAsn, setShowAddAsn]   = useState(false);
  const [newAsnName, setNewAsnName]   = useState("");
  // Mali
  const [maliSub, setMaliSub]         = useState("faturalar");
  const [maliYil, setMaliYil]         = useState(new Date().getFullYear().toString());
  const [addInvOpen, setAddInvOpen]   = useState(false);
  const [newInv, setNewInv]           = useState({firma:"",tarih:TODAY,tutarKdvHaric:"",currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:"",tip:"kesilen"});
  const [addExpOpen, setAddExpOpen]   = useState(false);
  const [newExp, setNewExp]           = useState({tarih:TODAY,aciklama:"",kategori:"Yakıt",tutarKdvDahil:"",kdvOrani:20});
  const [scanningExp, setScanningExp] = useState(false);
  const [exportOpen, setExportOpen]   = useState(false);
  const fileRef   = useRef();
  const taskXlsRef= useRef();
  const invFileRef= useRef();

  // ── DERIVED
  const AC = useMemo(()=>{ const m={}; assignees.forEach((a,i)=>{ m[a]=ASN_COLORS[i%ASN_COLORS.length]; }); return m; },[assignees]);
  const isAdmin = ADMIN_USERS.includes(currentUser);

  // ── PERSIST
  const sync = useCallback(async(table, data)=>{
    setSyncing(true); setSyncOk(false);
    await saveSupa(table, data);
    ls.set(`v12:${table}`,data);
    setTimeout(()=>{ setSyncing(false); setSyncOk(true); setTimeout(()=>setSyncOk(false),2000); },400);
  },[]);
  const setProposals = useCallback(u=>{ setProposalsS(u); sync("proposals",u); },[sync]);
  const setTasks     = useCallback(u=>{ setTasksS(u);     sync("tasks",u); },[sync]);
  const setInvoices  = useCallback(u=>{ setInvoicesS(u);  sync("invoices",u); },[sync]);
  const setExpenses  = useCallback(u=>{ setExpensesS(u);  sync("expenses",u); },[sync]);
  const setAssignees = useCallback(u=>{ setAssigneesS(u); sync("assignees",u); },[sync]);
  const setDurumCfg  = useCallback(u=>{ setDurumCfgS(u);  ls.set("v12:durum",u); },[]);
  const toast_       = useCallback(m=>{ setToast(m); setTimeout(()=>setToast(null),3000); },[]);

  // ── INIT
  useEffect(()=>{
    (async()=>{
      const supa_data = await loadSupa();
      const p   = supa_data.proposals || ls.get("v12:proposals") || ls.get("v11:p");
      const t   = supa_data.tasks     || ls.get("v12:tasks")     || ls.get("v11:t");
      const a   = supa_data.assignees || ls.get("v12:assignees") || ls.get("v11:a");
      const inv = supa_data.invoices  || ls.get("v12:invoices")  || ls.get("v11:inv");
      const exp = supa_data.expenses  || ls.get("v12:expenses")  || ls.get("v11:exp");
      const dur = ls.get("v12:durum");
      setProposalsS(p||PROPS0); setTasksS(t||TASKS0);
      if(a) setAssigneesS(a);
      setInvoicesS(inv||INVOICES0); setExpensesS(exp||[]);
      if(dur) setDurumCfgS(dur);
      const u = ls.get("v12:user") || ls.get("v11:user");
      if(u) setCurrentUser(u);
      setLoaded(true); fetchFX();
    })();
  // eslint-disable-next-line
  },[]);

  // ── FX
  const fetchFX = useCallback(async()=>{
    try{
      const r=await fetch("https://api.frankfurter.app/latest?base=EUR&symbols=TRY,USD");
      const d=await r.json();
      if(!d.rates?.TRY) throw new Error();
      setFx({EUR:d.rates.TRY,USD:d.rates.TRY/d.rates.USD,date:d.date,src:"Frankfurter/TCMB"});
    }catch{
      try{
        const r=await fetch("https://open.er-api.com/v6/latest/EUR");
        const d=await r.json();
        setFx({EUR:d.rates.TRY,USD:d.rates.TRY/d.rates.USD,date:TODAY,src:"ExchangeRate-API"});
      }catch{ setFx({EUR:50.82,USD:44.25,date:TODAY,src:"⚠️ Manuel"}); }
    }
  },[]);

  // ── REALTIME POLLING — her 20 saniyede Supabase'i kontrol et
  const lastUpdatedRef = useRef({});
  useEffect(()=>{
    if(!loaded) return;
    const TABLES = ["proposals","tasks","invoices","expenses","assignees"];
    const poll = async()=>{
      for(const t of TABLES){
        const ts = await sb.getUpdatedAt(t);
        if(ts && ts !== lastUpdatedRef.current[t]){
          lastUpdatedRef.current[t] = ts;
          // Veriyi yeniden çek
          const rows = await sb.get(t);
          const data = rows?.find(x=>x.id==="main")?.data;
          if(!data) continue;
          if(t==="proposals") setProposalsS(data);
          if(t==="tasks")     setTasksS(data);
          if(t==="invoices")  setInvoicesS(data);
          if(t==="expenses")  setExpensesS(data);
          if(t==="assignees") setAssigneesS(data);
        }
      }
    };
    const interval = setInterval(poll, 20000); // 20 saniye
    return ()=>clearInterval(interval);
  },[loaded]);

  // Historical rates
  useEffect(()=>{
    if(tab!=="mali") return;
    const pairs=[...new Set(invoices.filter(f=>f.currency!=="TRY").map(f=>`${f.tarih}_${f.currency}`))];
    pairs.forEach(async key=>{
      if(rateCache[key]) return;
      const [date,currency]=key.split("_");
      try{
        const r=await fetch(`https://api.frankfurter.app/${date}?base=${currency}&symbols=TRY`);
        const d=await r.json();
        if(d.rates?.TRY) setRateCache(prev=>({...prev,[key]:d.rates.TRY}));
      }catch{}
    });
  },[tab,invoices]);

  const toTRY = useCallback((amt,cur,date)=>{
    if(!amt||amt===0) return 0;
    if(cur==="TRY") return amt;
    const rate=(date&&rateCache[`${date}_${cur}`])||fx[cur]||(cur==="EUR"?50.82:44.25);
    return amt*rate;
  },[rateCache,fx]);

  // ── COMPUTED
  const pipeline  = useMemo(()=>proposals.filter(p=>p.durum==="bekliyoruz"),[proposals]);
  const done_     = useMemo(()=>proposals.filter(p=>p.durum==="tamamlandı"),[proposals]);
  const lost_     = useMemo(()=>proposals.filter(p=>["kaybedildi","durdu"].includes(p.durum)),[proposals]);
  const stale     = useMemo(()=>pipeline.filter(p=>daysSince(p.lastContact)>=30),[pipeline]);
  const openTasks = useMemo(()=>tasks.filter(t=>!t.done),[tasks]);
  const acilTasks = useMemo(()=>tasks.filter(t=>!t.done&&t.category==="acil"),[tasks]);
  const pipeTRY   = useMemo(()=>pipeline.reduce((s,p)=>s+(toTRY(p.amount,p.currency)||0),0),[pipeline,toTRY]);
  const doneTRY   = useMemo(()=>done_.reduce((s,p)=>s+(toTRY(p.amount,p.currency)||0),0),[done_,toTRY]);
  const winRate   = useMemo(()=>{ const t=done_.length+lost_.length; return t>0?Math.round(done_.length/t*100):0; },[done_,lost_]);

  const filteredProps = useMemo(()=>{
    let a=proposals;
    if(filter!=="all")      a=a.filter(p=>p.durum===filter);
    if(svcFilter!=="all")   a=a.filter(p=>p.service===svcFilter);
    if(asnFilter!=="all")   a=a.filter(p=>p.assignee===asnFilter);
    if(firmaFilter!=="all") a=a.filter(p=>p.firma===firmaFilter);
    if(search) a=a.filter(p=>(p.firma+p.yetkili+p.sehir+p.ref).toLowerCase().includes(search.toLowerCase()));
    return a;
  },[proposals,filter,svcFilter,asnFilter,firmaFilter,search]);

  const maliAllYears = maliYil==="Tümü";
  const invYear  = useMemo(()=>maliAllYears?invoices:invoices.filter(f=>getYil(f.tarih)===maliYil),[invoices,maliYil,maliAllYears]);
  const expYear  = useMemo(()=>maliAllYears?expenses:expenses.filter(e=>getYil(e.tarih)===maliYil),[expenses,maliYil,maliAllYears]);
  // KESİLEN faturalar = gelir
  const kesilenInv = useMemo(()=>invYear.filter(f=>f.tip==="kesilen"||!f.tip),[invYear]);
  const invTRY   = useMemo(()=>kesilenInv.reduce((s,f)=>s+toTRY(f.tutarKdvHaric,f.currency,f.tarih),0),[kesilenInv,toTRY]);
  const invKdv   = useMemo(()=>kesilenInv.reduce((s,f)=>s+toTRY(f.tutarKdvHaric,f.currency,f.tarih)*(f.kdvOrani/100),0),[kesilenInv,toTRY]);
  const expTotal = useMemo(()=>expYear.reduce((s,e)=>s+(e.tutarKdvDahil/(1+e.kdvOrani/100)),0),[expYear]);
  const expKdv   = useMemo(()=>expYear.reduce((s,e)=>{ const n=e.tutarKdvDahil/(1+e.kdvOrani/100); return s+(e.tutarKdvDahil-n); },0),[expYear]);
  const netKdv   = useMemo(()=>Math.max(0,invKdv-expKdv),[invKdv,expKdv]);

  // Vergi hesabı
  const yilNum    = useMemo(()=>maliAllYears?2026:parseInt(maliYil)||2026,[maliYil,maliAllYears]);
  const vergiMat  = useMemo(()=>Math.max(0,invTRY-expTotal),[invTRY,expTotal]);
  const tahmGV    = useMemo(()=>gelirVergisi(vergiMat, yilNum),[vergiMat,yilNum]);
  const geciciV   = useMemo(()=>geciciVergi(tahmGV),[tahmGV]);
  const damgaV    = useMemo(()=>invYear.reduce((s,f)=>s+damgaVergi(toTRY(f.tutarKdvHaric,f.currency,f.tarih)),0),[invYear,toTRY]);

  // SGK hesabı
  const sgkAylar  = useMemo(()=>{
    if(maliAllYears) return 12;
    return Math.min(12,Math.max(1,Math.ceil((new Date(TODAY)-new Date(`${maliYil}-01-01`))/86400000/30.44)));
  },[maliYil,maliAllYears]);
  const sgkBagKur = useMemo(()=>sgkAylar*SGK_BAG_KUR_AYLIK,[sgkAylar]);
  const sgkIsverenYillik = useMemo(()=>calısanYillikMaliyet(yilNum),[yilNum]);
  // Çalışan kaç ay bu dönemde?
  const calısanAylar = useMemo(()=>{
    let say=0;
    for(let m=1;m<=12;m++){ if(calısanMaliyet(yilNum,m)) say++; }
    return say;
  },[yilNum]);

  const toplamSGK = useMemo(()=>sgkBagKur+sgkIsverenYillik,[sgkBagKur,sgkIsverenYillik]);
  const toplamYuk = useMemo(()=>tahmGV+netKdv+toplamSGK+damgaV,[tahmGV,netKdv,toplamSGK,damgaV]);
  const netKalan  = useMemo(()=>Math.max(0,invTRY-toplamYuk),[invTRY,toplamYuk]);

  const aylikChart = useMemo(()=>{
    const months=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    return months.map((m,i)=>{
      const pad=String(i+1).padStart(2,"0");
      const f_ = maliAllYears ? (f=>getAy(f.tarih)?.slice(5)===pad) : (f=>getAy(f.tarih)===`${maliYil}-${pad}`);
      const gelir=kesilenInv.filter(f_).reduce((s,f)=>s+toTRY(f.tutarKdvHaric,f.currency,f.tarih),0);
      const gider=expYear.filter(maliAllYears?(e=>getAy(e.tarih)?.slice(5)===pad):e=>getAy(e.tarih)===`${maliYil}-${pad}`).reduce((s,e)=>s+(e.tutarKdvDahil/(1+e.kdvOrani/100)),0);
      return {name:m,Gelir:Math.round(gelir),Gider:Math.round(gider)};
    });
  },[kesilenInv,expYear,toTRY,maliYil,maliAllYears]);

  const availableYears = useMemo(()=>{
    const ys=[...new Set([...invoices.map(f=>getYil(f.tarih)),...expenses.map(e=>getYil(e.tarih))].filter(Boolean))].sort().reverse();
    return ["Tümü",...ys];
  },[invoices,expenses]);

  // ── MUTATIONS
  const upProp = useCallback((id,ch)=>{
    setProposals(proposals.map(p=>p.id===id?{...p,...ch}:p));
    setSelP(prev=>prev?.id===id?{...prev,...ch}:prev);
  },[proposals,setProposals]);

  const dupProp = useCallback((p)=>{
    const dup={...p,id:"p"+Date.now(),service:"DDX",durum:"bekliyoruz",notes:"",lastContact:TODAY};
    setProposals([dup,...proposals]);
    setSelP(dup); setEditingProp(true); setEditPropData(dup);
    toast_("📋 Kopyalandı — hizmet ve detayları güncelle");
  },[proposals,setProposals,toast_]);

  const addNote = useCallback(()=>{
    if(!newNote.trim()||!selP) return;
    const upd=`${TODAY}: ${newNote.trim()}\n${selP.notes||""}`;
    upProp(selP.id,{notes:upd,lastContact:TODAY}); setNewNote(""); toast_("✅ Not kaydedildi");
  },[newNote,selP,upProp,toast_]);

  const addProp = useCallback(()=>{
    if(!newProp.firma) return;
    setProposals([{...newProp,id:"p"+Date.now(),amount:parseFloat(newProp.amount)||0},...proposals]);
    setAddPropOpen(false);
    setNewProp({yetkili:"",firma:"",ref:"",sehir:"",durum:"bekliyoruz",service:"DDX",amount:"",currency:"EUR",notes:"",lastContact:TODAY,assignee:"Ergin Polat"});
    toast_("✅ Teklif eklendi");
  },[newProp,proposals,setProposals,toast_]);

  const togTask = useCallback((id)=>{
    const t=tasks.find(x=>x.id===id); if(!t) return;
    if(!t.done){
      setFadingTasks(prev=>({...prev,[id]:true}));
      setTimeout(()=>{ setTasks(tasks.map(x=>x.id===id?{...x,done:true}:x)); setFadingTasks(prev=>{const n={...prev};delete n[id];return n;}); },700);
    }else{ setTasks(tasks.map(x=>x.id===id?{...x,done:false}:x)); }
  },[tasks,setTasks]);

  const delTask = useCallback(id=>setTasks(tasks.filter(t=>t.id!==id)),[tasks,setTasks]);

  const addTask = useCallback(()=>{
    if(!newTaskText.trim()) return;
    setTasks([{text:newTaskText,category:newTaskCat,assignee:newTaskAsn,id:"k"+Date.now(),done:false,ref:"",...newTaskExtra},...tasks]);
    setNewTaskText(""); setNewTaskExtra({hedefTarih:"",telefon:"",firma:"",ilgiliKisi:"",konu:""}); setShowTaskDetail(false);
    toast_("✅ Görev eklendi");
  },[newTaskText,newTaskCat,newTaskAsn,newTaskExtra,tasks,setTasks,toast_]);

  const addAsn = useCallback(()=>{
    const n=newAsnName.trim(); if(!n||assignees.includes(n)) return;
    setAssignees([...assignees.filter(a=>a!=="Diğer"),n,"Diğer"]);
    setNewAsnName(""); setShowAddAsn(false); toast_(`✅ ${n} eklendi`);
  },[newAsnName,assignees,setAssignees,toast_]);

  const addInvoice = useCallback(()=>{
    if(!newInv.firma||!newInv.tutarKdvHaric) return;
    setInvoices([{...newInv,id:"f"+Date.now(),tutarKdvHaric:parseFloat(newInv.tutarKdvHaric)||0,kdvOrani:kdvRate(newInv.tarih)},...invoices]);
    setAddInvOpen(false); setNewInv({firma:"",tarih:TODAY,tutarKdvHaric:"",currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:"",tip:"kesilen"});
    toast_("✅ Fatura eklendi");
  },[newInv,invoices,setInvoices,toast_]);

  const addExpense = useCallback(()=>{
    if(!newExp.aciklama||!newExp.tutarKdvDahil) return;
    setExpenses([{...newExp,id:"e"+Date.now(),tutarKdvDahil:parseFloat(newExp.tutarKdvDahil)||0},...expenses]);
    setAddExpOpen(false); setNewExp({tarih:TODAY,aciklama:"",kategori:"Yakıt",tutarKdvDahil:"",kdvOrani:20});
    toast_("✅ Gider eklendi");
  },[newExp,expenses,setExpenses,toast_]);

  const scanReceipt = useCallback(async(file)=>{
    setScanningExp(true);
    try{
      const b64=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},{type:"text",text:`Bu fiş/faturayı analiz et. Sadece JSON: {"tarih":"YYYY-MM-DD","aciklama":"açıklama","tutarKdvDahil":sayı,"kdvOrani":sayı,"kategori":"Yakıt|Gıda|Restoran/Kafe|Ofis Malzeme|Ulaşım|Konaklama|Telefon/İnternet|Kırtasiye|Reklam/Tanıtım|Diğer"}. Tarih yok: ${TODAY}. KDV yok: 20.`}]}]})});
      const data=await resp.json();
      const text=data.content?.[0]?.text||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setNewExp(prev=>({...prev,...parsed,tutarKdvDahil:String(parsed.tutarKdvDahil||"")}));
      setAddExpOpen(true); toast_("🤖 Fiş okundu!");
    }catch{ toast_("⚠️ Fiş okunamadı, manuel gir."); }
    setScanningExp(false);
  },[toast_]);

  const importTasksXLS = useCallback((file)=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const text=e.target.result;
      const lines=text.split("\n").filter(l=>l.trim());
      if(lines.length<2){ toast_("⚠️ Dosya boş veya hatalı"); return; }
      const sep=lines[0].includes(";")?";":",";
      const headers=lines[0].split(sep).map(h=>h.replace(/"/g,"").trim().toLowerCase());
      const newTasks=[];
      for(let i=1;i<lines.length;i++){
        const cols=lines[i].split(sep).map(c=>c.replace(/"/g,"").trim());
        if(!cols[0]) continue;
        const get=(...keys)=>{ for(const k of keys){ const idx=headers.indexOf(k); if(idx>=0&&cols[idx]) return cols[idx]; } return ""; };
        const text_=get("görev","gorev","text","task","konu","açıklama","aciklama")||cols[0];
        if(!text_) continue;
        const catRaw=get("kategori","category","cat","tür","tur")||"takip";
        const cat=CATS.find(c=>catRaw.toLowerCase().includes(c))||"takip";
        const asnRaw=get("atanan","assignee","kişi","kisi","sorumlu")||currentUser||"Ergin Polat";
        const asn=isAdmin?asnRaw:(currentUser||"Ergin Polat");
        newTasks.push({id:"k"+Date.now()+i,text:text_,category:cat,assignee:asn,ref:get("ref","referans","not"),done:false});
      }
      if(!newTasks.length){ toast_("⚠️ Görev bulunamadı. Sütun: Görev, Kategori, Atanan"); return; }
      setTasks([...newTasks,...tasks]); toast_(`✅ ${newTasks.length} görev yüklendi`);
    };
    reader.readAsText(file,"UTF-8");
  },[tasks,setTasks,currentUser,isAdmin,toast_]);

  // PDF Rapor
  const generatePDFReport = useCallback((type)=>{
    const eur=fx.EUR||50.82; const usd=fx.USD||44.25;
    if(type==="pipeline"){
      const rows=pipeline.map(p=>{
        const try_=toTRY(p.amount,p.currency);
        return `<tr><td>${p.firma}</td><td>${p.yetkili||""}</td><td><span class="badge" style="background:${(SVC_C[p.service]||SVC_C["Diğer"]).bg};color:${(SVC_C[p.service]||SVC_C["Diğer"]).text}">${p.service}</span></td><td>${SYM[p.currency]}${fmtN(p.amount)}</td><td>₺${fmtN(try_)}</td><td>€${fmtN(try_/eur)}</td><td>$${fmtN(try_/usd)}</td><td>${p.assignee?.split(" ")[0]||""}</td><td>${daysSince(p.lastContact)}g</td></tr>`;
      }).join("");
      printPDF(`
        <div class="header"><div><div class="logo-text">SENSEİ</div><div class="logo-sub">Danışmanlık · Var Olan "Öz"dedir</div></div><div class="meta"><b>Pipeline Raporu</b><br>${TODAY}<br>VKN: ${MUK.vkn}</div></div>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-v">${pipeline.length}</div><div class="kpi-l">Aktif Teklif</div></div>
          <div class="kpi"><div class="kpi-v">₺${fmtN(pipeTRY)}</div><div class="kpi-l">Pipeline TRY</div></div>
          <div class="kpi"><div class="kpi-v">€${fmtN(pipeTRY/eur)}</div><div class="kpi-l">Pipeline EUR</div></div>
          <div class="kpi"><div class="kpi-v">%${winRate}</div><div class="kpi-l">Kazanma Oranı</div></div>
        </div>
        <h2>Aktif Pipeline</h2>
        <table><thead><tr><th>Firma</th><th>Yetkili</th><th>Hizmet</th><th>Teklif</th><th>TRY</th><th>EUR</th><th>USD</th><th>Atanan</th><th>Sessiz</th></tr></thead><tbody>${rows}</tbody></table>
      `,"Pipeline Raporu");
    }else if(type==="mali"){
      const invRows=kesilenInv.sort((a,b)=>b.tarih.localeCompare(a.tarih)).map(f=>{
        const rKey=`${f.tarih}_${f.currency}`;const hist=rateCache[rKey];const rate=f.currency==="TRY"?1:(hist||fx[f.currency]||eur);
        const tryB=Math.round(f.tutarKdvHaric*rate);const kdvT=Math.round(tryB*(f.kdvOrani/100));
        return `<tr><td>${fmtD(f.tarih)}</td><td>${f.firma}</td><td>${f.service}</td><td>${SYM[f.currency]}${fmtN(f.tutarKdvHaric)}</td><td>₺${fmtN(tryB)}</td><td>€${fmtN(tryB/eur)}</td><td>$${fmtN(tryB/usd)}</td><td>%${f.kdvOrani}</td><td>₺${fmtN(kdvT)}</td></tr>`;
      }).join("");
      printPDF(`
        <div class="header"><div><div class="logo-text">SENSEİ</div><div class="logo-sub">Danışmanlık · Var Olan "Öz"dedir</div></div><div class="meta"><b>Mali Rapor — ${maliYil}</b><br>${TODAY}<br>VKN: ${MUK.vkn} · ${MUK.vd} V.D.</div></div>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-v">₺${fmtN(invTRY)}</div><div class="kpi-l">Gelir (KDV hariç)</div></div>
          <div class="kpi"><div class="kpi-v">₺${fmtN(expTotal)}</div><div class="kpi-l">Gider (KDV hariç)</div></div>
          <div class="kpi"><div class="kpi-v">₺${fmtN(netKdv)}</div><div class="kpi-l">Net KDV</div></div>
          <div class="kpi"><div class="kpi-v">₺${fmtN(tahmGV)}</div><div class="kpi-l">Gelir Vergisi</div></div>
          <div class="kpi"><div class="kpi-v">₺${fmtN(toplamSGK)}</div><div class="kpi-l">SGK Toplam</div></div>
          <div class="kpi"><div class="kpi-v">₺${fmtN(netKalan)}</div><div class="kpi-l">Net Kalan</div></div>
        </div>
        <h2>Kesilen Faturalar</h2>
        <table><thead><tr><th>Tarih</th><th>Firma</th><th>Hizmet</th><th>Tutar</th><th>TRY</th><th>EUR</th><th>USD</th><th>KDV%</th><th>KDV</th></tr></thead><tbody>${invRows}</tbody></table>
        <h2>Vergi & SGK Özeti</h2>
        <table><thead><tr><th>Kalem</th><th>TRY</th><th>EUR</th><th>USD</th><th>Açıklama</th></tr></thead><tbody>
          <tr><td>Gelir Vergisi</td><td>₺${fmtN(tahmGV)}</td><td>€${fmtN(tahmGV/eur)}</td><td>$${fmtN(tahmGV/usd)}</td><td>2026 dilimli (%15-%40)</td></tr>
          <tr><td>Net KDV (ödenecek)</td><td>₺${fmtN(netKdv)}</td><td>€${fmtN(netKdv/eur)}</td><td>$${fmtN(netKdv/usd)}</td><td>Tahsil − İndirim</td></tr>
          <tr><td>SGK Bağ-Kur (4/b)</td><td>₺${fmtN(sgkBagKur)}</td><td>€${fmtN(sgkBagKur/eur)}</td><td>$${fmtN(sgkBagKur/usd)}</td><td>${sgkAylar} ay × ₺${fmtN(SGK_BAG_KUR_AYLIK)}</td></tr>
          <tr><td>SGK İşveren (çalışan)</td><td>₺${fmtN(sgkIsverenYillik)}</td><td>€${fmtN(sgkIsverenYillik/eur)}</td><td>$${fmtN(sgkIsverenYillik/usd)}</td><td>${calısanAylar} ay, asgari ücretli</td></tr>
          <tr><td>Damga Vergisi</td><td>₺${fmtN(damgaV)}</td><td>€${fmtN(damgaV/eur)}</td><td>$${fmtN(damgaV/usd)}</td><td>Fatura tutarı × %0.759</td></tr>
          <tr style="font-weight:800"><td>TOPLAM YÜK</td><td>₺${fmtN(toplamYuk)}</td><td>€${fmtN(toplamYuk/eur)}</td><td>$${fmtN(toplamYuk/usd)}</td><td>Efektif: %${invTRY>0?Math.round(toplamYuk/invTRY*100):0}</td></tr>
          <tr style="color:#1a7a5e;font-weight:800"><td>NET KALAN</td><td>₺${fmtN(netKalan)}</td><td>€${fmtN(netKalan/eur)}</td><td>$${fmtN(netKalan/usd)}</td><td></td></tr>
        </tbody></table>
        <div class="warning">⚠️ Bu rapor tahmini hesaplamadır. Kesin beyan için mali müşavirinize danışınız. Geçici vergi çeyrek başına ₺${fmtN(geciciV)} olarak ödenir.</div>
      `,"Mali Rapor "+maliYil);
    }
  },[pipeline,pipeTRY,winRate,kesilenInv,invTRY,expTotal,netKdv,tahmGV,toplamSGK,sgkBagKur,sgkIsverenYillik,netKalan,toplamYuk,damgaV,geciciV,calısanAylar,sgkAylar,fx,rateCache,toTRY,maliYil]);

  const doLogin = useCallback((name, pass)=>{
    if(!name.trim()){ setLoginErr("Kullanıcı adı boş olamaz."); return; }
    const dogrSifre = KULLANICI_SIFRELER[name.trim()];
    if(!dogrSifre){ setLoginErr("Bu kullanıcı tanımlı değil."); return; }
    if(pass !== dogrSifre){ setLoginErr("Şifre hatalı."); return; }
    const n=name.trim();
    setCurrentUser(n); setNewTaskAsn(n); setLoginErr("");
    ls.set("v12:user",n);
  },[]);

  // ── LOADING
  if(!loaded) return <div style={{background:B.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:B.muted,fontFamily:"system-ui",flexDirection:"column",gap:12}}>
    <div style={{width:40,height:40,background:B.navy,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke={B.gold} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
    <div style={{fontWeight:700,color:B.navy}}>SENSEİ CRM yükleniyor...</div>
  </div>;

  // ── LOGIN
  if(!currentUser) return (
    <div style={{background:`linear-gradient(135deg,${B.navy} 0%,#2b4170 100%)`,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;700;800&display=swap');*{box-sizing:border-box}button:hover{opacity:.88}`}</style>
      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"44px 48px",maxWidth:400,width:"90%",textAlign:"center",boxShadow:"0 20px 60px #00000040"}}>
        <div style={{marginBottom:8}}>
          <img src="/logo_sensei.jpg" alt="SENSEİ Danışmanlık"
            style={{height:80,width:"auto",objectFit:"contain",maxWidth:"100%"}}
            onError={e=>{e.target.style.display="none";}}
          />
        </div>
        <div style={{fontSize:11,color:B.dim,marginBottom:24,fontStyle:"italic"}}>"Var Olan 'Öz'dedir"</div>
        {/* Kullanıcı seç */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Kullanıcı Seç</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.keys(KULLANICI_SIFRELER).map((name,i)=>(
              <button key={name} onClick={()=>{ setLoginName(name); setLoginErr(""); }}
                style={{background:loginName===name?B.navy:B.navyLight,color:loginName===name?"#fff":B.navy,border:`2px solid ${loginName===name?B.navy:B.border}`,borderRadius:12,padding:"11px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
                <div style={{width:32,height:32,background:i===0?B.gold:B.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0,color:"#fff"}}>{name.split(" ").map(n=>n[0]).join("")}</div>
                <span style={{flex:1,textAlign:"left"}}>{name}</span>
                {loginName===name&&<span style={{fontSize:14}}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        {/* Şifre */}
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Şifre</div>
          <input type="password" style={INP({width:"100%",fontSize:14,padding:"10px 14px"})} placeholder="••••••••"
            value={loginPass} onChange={e=>{ setLoginPass(e.target.value); setLoginErr(""); }}
            onKeyDown={e=>e.key==="Enter"&&doLogin(loginName,loginPass)} autoComplete="current-password"/>
        </div>
        {loginErr&&<div style={{color:B.red,fontSize:12,marginBottom:8,fontWeight:600}}>⚠️ {loginErr}</div>}
        <Btn style={{width:"100%",padding:"12px",fontSize:14,marginTop:4}} onClick={()=>doLogin(loginName,loginPass)}>🔐 Giriş Yap</Btn>
        <div style={{fontSize:10,color:B.dim,marginTop:12}}>Şifrenizi bilmiyorsanız Ergin Polat ile iletişime geçin.</div>
      </div>
    </div>
  );

  const TABS=[{id:"dashboard",label:"📊 Dashboard"},{id:"pipeline",label:`💼 Pipeline (${pipeline.length})`},{id:"tasks",label:`✅ Görevler (${openTasks.length})`},{id:"mali",label:"💰 Mali"}];

  return (
    <div style={{background:B.bg,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:B.text,fontSize:14}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;700;800&display=swap');*{box-sizing:border-box}select option{background:#fff;color:#1a2744}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#e2e5ee;border-radius:3px}input[type=checkbox]{cursor:pointer}button:hover{opacity:.88;transition:opacity .15s}table th,table td{vertical-align:middle}`}</style>

      {/* HEADER */}
      <div style={{background:B.navy,padding:"0 20px",display:"flex",alignItems:"center",gap:16,height:54,position:"sticky",top:0,zIndex:50,boxShadow:`0 2px 12px ${B.navy}60`}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
          <img src="/logo_sensei.jpg" alt="SENSEİ Danışmanlık"
            style={{height:38,width:"auto",objectFit:"contain",filter:"brightness(0) invert(1)"}}
            onError={e=>{e.target.style.display="none"; e.target.nextSibling.style.display="flex";}}
          />
          <div style={{display:"none",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,background:B.gold,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontWeight:700,fontSize:20,color:"#fff",letterSpacing:"0.08em",lineHeight:1}}>SENSEİ</div>
              <div style={{fontSize:8,color:B.gold,letterSpacing:"0.2em",textTransform:"uppercase",lineHeight:1,marginTop:1}}>Danışmanlık</div>
            </div>
          </div>
        </div>
        <div style={{width:1,height:28,background:"#ffffff20",flexShrink:0}}/>
        <nav style={{display:"flex",alignItems:"stretch",height:"100%",flex:1}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",color:tab===t.id?"#fff":"#ffffff70",border:"none",borderBottom:tab===t.id?`2.5px solid ${B.gold}`:"2.5px solid transparent",padding:"0 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?800:500,fontFamily:"inherit"}}>{t.label}</button>)}
        </nav>
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {/* Sync indicator */}
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:syncing?B.gold:syncOk?"#5de0a0":"#ffffff60",fontWeight:600}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:syncing?B.gold:syncOk?"#5de0a0":"#ffffff30",transition:"background 0.3s"}}/>
            <span>{syncing?"Kaydediliyor":syncOk?"Kaydedildi ✓":"Senkron"}</span>
          </div>
          <div style={{background:"#ffffff20",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
            {currentUser.split(" ")[0]}
            <button onClick={()=>{ setCurrentUser(null); ls.set("v12:user",null); }} style={{background:"#ffffff20",border:"none",color:"#fff",borderRadius:6,padding:"1px 6px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>çıkış</button>
          </div>
          {(acilTasks.length>0||stale.length>0)&&<div style={{background:B.red,color:"#fff",borderRadius:20,padding:"4px 10px",fontSize:12,fontWeight:700}}>⚡ {acilTasks.length+stale.length}</div>}
          <div style={{position:"relative"}}>
            <Btn sm style={{background:"#ffffff20",color:"#fff",border:"none"}} onClick={()=>setExportOpen(v=>!v)}>⬇️ Export</Btn>
            {exportOpen&&<div style={{position:"absolute",top:38,right:0,background:"#fff",border:`1px solid ${B.border}`,borderRadius:12,padding:8,minWidth:250,zIndex:300,boxShadow:`0 8px 32px #00000020`}} onClick={()=>setExportOpen(false)}>
              {[
                {l:"📊 Tüm Teklifler → Excel", fn:()=>dlCSV(proposals.map(p=>({Firma:p.firma,Yetkili:p.yetkili,Hizmet:p.service,Durum:p.durum,Atanan:p.assignee,Tutar:p.amount,Kur:p.currency,TRY:Math.round(toTRY(p.amount,p.currency)||0),SonTemas:p.lastContact})),`SENSEi_Teklifler_${TODAY}.csv`)},
                {l:"📊 Pipeline → Excel", fn:()=>dlCSV(pipeline.map(p=>({Firma:p.firma,Hizmet:p.service,Atanan:p.assignee,Tutar:p.amount,Kur:p.currency,TRY:Math.round(toTRY(p.amount,p.currency)||0),Sessiz:daysSince(p.lastContact)})),`SENSEi_Pipeline_${TODAY}.csv`)},
                {l:"📊 Faturalar → Excel", fn:()=>dlCSV(kesilenInv.map(f=>({Tarih:f.tarih,Firma:f.firma,Hizmet:f.service,Tutar:f.tutarKdvHaric,Kur:f.currency,KDV:f.kdvOrani,TRY:Math.round(toTRY(f.tutarKdvHaric,f.currency,f.tarih))})),`SENSEi_Faturalar_${maliYil}.csv`)},
                {l:"📊 Giderler → Excel", fn:()=>dlCSV(expYear.map(e=>({Tarih:e.tarih,Aciklama:e.aciklama,Kategori:e.kategori,KDVdahil:e.tutarKdvDahil,KDV:e.kdvOrani})),`SENSEi_Giderler_${maliYil}.csv`)},
                {l:"🖨️ Pipeline Raporu → PDF", fn:()=>generatePDFReport("pipeline")},
                {l:"🖨️ Mali Rapor → PDF", fn:()=>generatePDFReport("mali")},
              ].map(item=><button key={item.l} onClick={item.fn} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",borderRadius:8,padding:"8px 12px",fontSize:13,cursor:"pointer",color:B.text,fontFamily:"inherit",display:"block"}} onMouseEnter={e=>e.currentTarget.style.background=B.navyLight} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{item.l}</button>)}
            </div>}
          </div>
        </div>
      </div>

      <div style={{padding:"16px 20px",maxWidth:1300,margin:"0 auto"}}>

      {/* ══ DASHBOARD ══ */}
      {tab==="dashboard"&&(()=>{
        const svcChart=SERVICES.map(s=>({name:s.replace(" Dönüşüm",""),pipeline:pipeline.filter(p=>p.service===s).length,tamamlanan:done_.filter(p=>p.service===s).length})).filter(d=>d.pipeline+d.tamamlanan>0);
        const pieData=[{name:"Tamamlandı",value:done_.length,color:B.green},{name:"Bekliyoruz",value:pipeline.length,color:B.gold},{name:"Kaybedildi",value:lost_.length,color:B.red},{name:"Ertelendi",value:proposals.filter(p=>p.durum==="ertelendi").length,color:B.purple}].filter(d=>d.value>0);
        return <div>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KpiCard l="Pipeline" v={pipeline.length} sub="aktif teklif" c={B.navy}/>
            <KpiCard l="Tamamlandı" v={done_.length} sub="proje" c={B.green}/>
            <KpiCard l="Kazanma Oranı" v="" pct={winRate} sub={`${done_.length}/(${done_.length+lost_.length})`} c={winRate>=50?B.green:B.amber}/>
            <KpiCard l="Kazanılan" v={"₺"+fmtN(doneTRY)} sub={`€${fmtN(doneTRY/(fx.EUR||50.82))} · $${fmtN(doneTRY/(fx.USD||44.25))}`} c={B.green}/>
            <KpiCard l="Potansiyel" v={"₺"+fmtN(pipeTRY)} sub={`€${fmtN(pipeTRY/(fx.EUR||50.82))} · $${fmtN(pipeTRY/(fx.USD||44.25))}`} c={B.gold}/>
            <KpiCard l="Sessiz 30g+" v={stale.length} sub="teklif" c={stale.length>0?B.red:B.dim}/>
          </div>
          {/* FX */}
          <Card style={{marginBottom:14}}>
            <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:9,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>
                  TCMB Döviz Kuru{fx.date?` · ${fx.date}`:""}  {fx.src&&<span style={{color:B.dim,fontWeight:400}}>({fx.src})</span>}
                </div>
                <div style={{display:"flex",gap:20,alignItems:"center"}}>
                  <div><span style={{color:B.dim,fontSize:12}}>1€ = </span><span style={{fontWeight:800,color:B.navy,fontSize:22}}>₺{fx.EUR.toFixed(2)}</span></div>
                  <div><span style={{color:B.dim,fontSize:12}}>1$ = </span><span style={{fontWeight:800,color:B.navy,fontSize:22}}>₺{fx.USD.toFixed(2)}</span></div>
                  <div style={{borderLeft:`1px solid ${B.border}`,paddingLeft:14}}>
                    <div style={{fontSize:11,color:B.muted}}>1₺ = €{(1/fx.EUR).toFixed(4)}</div>
                    <div style={{fontSize:11,color:B.muted}}>1₺ = ${(1/fx.USD).toFixed(4)}</div>
                  </div>
                </div>
              </div>
              <Btn sm outline color={B.muted} style={{marginLeft:"auto"}} onClick={fetchFX}>🔄 Güncelle</Btn>
            </div>
          </Card>
          {/* Vergi özet */}
          <Card style={{marginBottom:14,borderLeft:`4px solid ${B.navy}`}}>
            <div style={{fontWeight:800,color:B.navy,marginBottom:12,fontSize:13}}>🏛️ Anlık Vergi & SGK Yükü ({new Date().getFullYear()})</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[
                {l:"Tahmini Gelir Vergisi",v:"₺"+fmtN(tahmGV),c:B.red},
                {l:"Net KDV",v:"₺"+fmtN(netKdv),c:B.amber},
                {l:"SGK Bağ-Kur",v:"₺"+fmtN(sgkBagKur),c:B.purple},
                {l:"SGK İşveren",v:"₺"+fmtN(sgkIsverenYillik),c:B.purple},
                {l:"Damga Vergisi",v:"₺"+fmtN(damgaV),c:B.muted},
                {l:"TOPLAM YÜK",v:"₺"+fmtN(toplamYuk),c:B.red},
                {l:"NET KALAN",v:"₺"+fmtN(netKalan),c:B.green},
              ].map((s,i)=><div key={i} style={{background:i===5?B.redLight:i===6?B.greenLight:B.bg,borderRadius:8,padding:"8px 14px",minWidth:120,borderTop:`2px solid ${s.c}`}}>
                <div style={{fontWeight:800,color:s.c,fontSize:14}}>{s.v}</div>
                <div style={{fontSize:10,color:B.muted,marginTop:2}}>{s.l}</div>
              </div>)}
            </div>
            <div style={{marginTop:10,fontSize:11,color:B.dim}}>
              2026 GV dilimleri: %15 (&lt;190k) · %20 (&lt;400k) · %27 (&lt;1.5M) · %35 (&lt;5.3M) · %40 (+) · Geçici vergi: ₺{fmtN(geciciV)}/çeyrek · Damga: %0.759
            </div>
          </Card>
          {/* Alerts */}
          {(acilTasks.length>0||stale.length>0)&&<Card style={{marginBottom:14,borderLeft:`4px solid ${B.red}`}}>
            <div style={{fontSize:12,fontWeight:800,color:B.red,marginBottom:8}}>⚡ Aksiyon Gerekiyor</div>
            {acilTasks.slice(0,3).map(t=><div key={t.id} style={{fontSize:12,color:B.red,padding:"3px 0"}}>🔴 {t.text} <span style={{color:B.muted}}>→ {t.assignee}</span></div>)}
            {stale.slice(0,3).map(p=><div key={p.id} style={{fontSize:12,color:B.amber,padding:"3px 0"}}>⚠️ {p.firma} — {daysSince(p.lastContact)} gün sessiz</div>)}
          </Card>}
          {/* Charts */}
          <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
            <Card style={{flex:2,minWidth:280}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>Hizmet Türüne Göre Pipeline</div>
              <ResponsiveContainer width="100%" height={170}><BarChart data={svcChart} margin={{top:0,right:0,bottom:22,left:0}}><CartesianGrid strokeDasharray="3 3" stroke={B.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:B.muted}} angle={-30} textAnchor="end" interval={0}/><YAxis tick={{fontSize:10,fill:B.muted}} width={22}/><Tooltip contentStyle={{fontFamily:"inherit",fontSize:12,borderRadius:8}}/><Bar dataKey="tamamlanan" stackId="a" fill={B.green} name="Tamamlandı"/><Bar dataKey="pipeline" stackId="a" fill={B.gold} name="Pipeline" radius={[4,4,0,0]}/><Legend wrapperStyle={{fontSize:10,paddingTop:6}}/></BarChart></ResponsiveContainer>
            </Card>
            <Card style={{flex:1,minWidth:160}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>Teklif Durumu</div>
              <ResponsiveContainer width="100%" height={170}><PieChart><Pie data={pieData} cx="50%" cy="48%" outerRadius={58} dataKey="value" label={({name,value})=>`${name.slice(0,4)}:${value}`} labelLine={false} fontSize={9}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{fontFamily:"inherit",fontSize:12,borderRadius:8}}/></PieChart></ResponsiveContainer>
            </Card>
            <Card style={{flex:1,minWidth:160}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>Aylık Gelir</div>
              <ResponsiveContainer width="100%" height={170}><BarChart data={aylikChart} margin={{top:0,right:0,bottom:0,left:0}}><CartesianGrid strokeDasharray="3 3" stroke={B.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:B.muted}}/><YAxis tick={{fontSize:9,fill:B.muted}} width={38} tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:v}/><Tooltip contentStyle={{fontFamily:"inherit",fontSize:11,borderRadius:8}} formatter={v=>"₺"+fmtN(v)}/><Bar dataKey="Gelir" fill={B.navy} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
            </Card>
          </div>
          {/* Ekip + hızlı */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <Card style={{flex:2,minWidth:260}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:800,color:B.navy,fontSize:13}}>👥 Ekip Dağılımı</div>
                <Btn sm outline color={B.navy} onClick={()=>setShowAddAsn(v=>!v)}>+ Kişi</Btn>
              </div>
              {showAddAsn&&<div style={{display:"flex",gap:8,marginBottom:12}}>
                <input style={INP({flex:1})} placeholder="Ad Soyad" value={newAsnName} onChange={e=>setNewAsnName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAsn()}/>
                <Btn sm onClick={addAsn}>Ekle</Btn><Btn sm outline color={B.muted} onClick={()=>setShowAddAsn(false)}>İptal</Btn>
              </div>}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {assignees.map(a=>{ const items=openTasks.filter(t=>t.assignee===a); const c=AC[a]||B.navy;
                  return <div key={a} style={{flex:1,minWidth:120,background:B.bg,borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${c}`}}>
                    <div style={{fontWeight:800,color:c,fontSize:12,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span>{a.split(" ")[0]} <span style={{fontWeight:400,color:B.muted,fontSize:11}}>({items.length})</span></span>
                      {/* Sadece Ergin silebilir, kendini silemesin */}
                      {currentUser==="Ergin Polat"&&a!=="Ergin Polat"&&<button onClick={()=>{ if(confirm(`"${a}" kişisini silmek istiyor musunuz?`)){ setAssignees(assignees.filter(x=>x!==a)); toast_(`🗑️ ${a} silindi`); } }} style={{background:"transparent",border:"none",color:B.red,cursor:"pointer",fontSize:13,padding:0,lineHeight:1}} title="Kişiyi sil">×</button>}
                    </div>
                    {items.slice(0,4).map(t=><div key={t.id} style={{fontSize:11,color:B.muted,padding:"2px 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>• {t.text}</div>)}
                    {items.length===0&&<div style={{fontSize:10,color:B.dim}}>Açık görev yok ✅</div>}
                  </div>;
                })}
              </div>
            </Card>
            <Card style={{flex:1,minWidth:200}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:10,fontSize:13}}>📧 Hızlı İşlemler</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <Btn color={B.gold} onClick={()=>{
                  let txt=`📊 SENSEİ ÖZET — ${TODAY}\n${"─".repeat(40)}\n\n`;
                  if(acilTasks.length){ txt+=`🔴 ACİL\n`; acilTasks.forEach(t=>txt+=`  • ${t.text} → ${t.assignee.split(" ")[0]}\n`); txt+="\n"; }
                  assignees.forEach(a=>{ const i=openTasks.filter(t=>t.assignee===a&&["arama","toplantı","aksiyon","acil"].includes(t.category)); if(i.length){ txt+=`👤 ${a}\n`; i.forEach(t=>txt+=`  • ${t.text}\n`); txt+="\n"; } });
                  txt+=`💰 Pipeline: ${pipeline.length} · ₺${fmtN(pipeTRY)} · %${winRate} kazanma`;
                  navigator.clipboard.writeText(txt).then(()=>toast_("📧 Kopyalandı!")).catch(()=>alert(txt));
                }}>📧 Haftalık Özet → Outlook</Btn>
                <Btn color={B.navy} outline onClick={()=>generatePDFReport("pipeline")}>🖨️ Pipeline Raporu PDF</Btn>
                <Btn color={B.navy} outline onClick={()=>generatePDFReport("mali")}>🖨️ Mali Rapor PDF</Btn>
              </div>
            </Card>
          </div>
        </div>;
      })()}

      {/* ══ PIPELINE ══ */}
      {tab==="pipeline"&&<div style={{display:"flex",gap:14,height:"calc(100vh - 130px)"}}>
        <div style={{width:selP?360:"100%",flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Card style={{marginBottom:10,padding:12}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input style={INP({flex:1})} placeholder="Firma / yetkili / şehir..." value={search} onChange={e=>setSearch(e.target.value)}/>
              <Btn sm onClick={()=>setAddPropOpen(true)}>+ Yeni Teklif</Btn>
              <Btn sm outline color={B.muted} onClick={()=>setManageDurum(true)} title="Durum etiketlerini yönet">⚙️</Btn>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
              {["all",...Object.keys(durumCfg)].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?B.navy:"#fff",color:filter===f?"#fff":B.muted,border:`1px solid ${filter===f?B.navy:B.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
                  {f==="all"?"Tümü":(durumCfg[f]?.label||f).replace(/^[^\s]+ /,"")} ({f==="all"?proposals.length:proposals.filter(p=>p.durum===f).length})
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
              {["all",...SERVICES].map(s=><button key={s} onClick={()=>setSvcFilter(s)} style={{background:svcFilter===s?(SVC_C[s]||{bg:B.navy}).bg||B.navy:"#fff",color:svcFilter===s?(SVC_C[s]||{text:"#fff"}).text||"#fff":B.dim,border:`1px solid ${svcFilter===s?(SVC_C[s]||{dot:B.navy}).dot||B.navy:B.border}30`,borderRadius:20,padding:"2px 9px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s==="all"?"Hepsi":s}</button>)}
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4}}>
              {["all",...assignees].map(a=><button key={a} onClick={()=>setAsnFilter(a)} style={{background:asnFilter===a?(AC[a]||B.navy):"#fff",color:asnFilter===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}40`,borderRadius:20,padding:"2px 10px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a==="all"?"Herkes":a.split(" ")[0]}</button>)}
            </div>
            {(()=>{
              const cnt={}; proposals.forEach(p=>{cnt[p.firma]=(cnt[p.firma]||0)+1;});
              const multi=Object.entries(cnt).filter(([,c])=>c>1).map(([f])=>f).sort();
              if(!multi.length) return null;
              return <div>
                <div style={{fontSize:9,color:B.dim,marginBottom:3,fontWeight:700}}>🏢 Çoklu teklif firmaları</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {firmaFilter!=="all"&&<button onClick={()=>setFirmaFilter("all")} style={{background:B.navyLight,color:B.navy,border:`1px solid ${B.border}`,borderRadius:20,padding:"2px 8px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>× Temizle</button>}
                  {multi.map(f=><button key={f} onClick={()=>setFirmaFilter(firmaFilter===f?"all":f)} style={{background:firmaFilter===f?B.purple:B.purpleLight,color:firmaFilter===f?"#fff":B.purple,border:`1px solid ${B.purple}40`,borderRadius:20,padding:"2px 8px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{f.length>18?f.slice(0,16)+"…":f} ×{cnt[f]}</button>)}
                </div>
              </div>;
            })()}
          </Card>

          <div style={{overflow:"auto",flex:1}}>
            {filteredProps.filter(p=>p.durum!=="tamamlandı").map(p=>{
              const days=daysSince(p.lastContact); const isStale=days>=30&&p.durum==="bekliyoruz";
              const sel=selP?.id===p.id; const tryVal=toTRY(p.amount,p.currency,p.lastContact);
              return <div key={p.id} style={{background:sel?B.navyLight:B.card,border:`1px solid ${sel?B.navy+"50":B.border}`,borderLeft:`3px solid ${sel?B.navy:(SVC_C[p.service]?.dot||B.dim)}`,borderRadius:10,padding:"10px 12px",marginBottom:7,boxShadow:sel?"0 2px 12px #1a274418":"0 1px 3px #1a274406"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}} onClick={()=>setSelP(sel?null:p)}>
                  <div style={{flex:1,minWidth:0,cursor:"pointer"}}>
                    <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.firma}</div>
                    <div style={{fontSize:11,color:B.muted,marginTop:2}}>{p.yetkili}{p.sehir?` · ${p.sehir}`:""}</div>
                  </div>
                  <div style={{display:"flex",gap:5,alignItems:"flex-start",flexShrink:0}}>
                    {p.amount>0&&<div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800,fontSize:12,color:B.navy}}>{SYM[p.currency]}{fmtN(p.amount)}</div>
                      {p.currency!=="TRY"&&tryVal>0&&<div style={{fontSize:10,color:B.green}}>₺{fmtN(tryVal)}</div>}
                      {p.currency!=="EUR"&&fx.EUR&&tryVal>0&&<div style={{fontSize:10,color:B.dim}}>€{fmtN(tryVal/fx.EUR)}</div>}
                    </div>}
                    <button title="Kopyala" onClick={e=>{e.stopPropagation();dupProp(p);}} style={{background:"transparent",border:`1px solid ${B.border}`,borderRadius:6,padding:"3px 6px",cursor:"pointer",fontSize:11,color:B.muted}}>📋</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap",alignItems:"center",cursor:"pointer"}} onClick={()=>setSelP(sel?null:p)}>
                  <DurumBadge d={p.durum} cfg={durumCfg}/><SvcBadge svc={p.service}/>
                  <Chip label={p.assignee.split(" ")[0]} color={AC[p.assignee]||B.muted} sm/>
                  {isStale&&<Chip label={`⚠️ ${days}g sessiz`} color={B.red} sm/>}
                </div>
              </div>;
            })}
            {(filter==="all"||filter==="tamamlandı")&&filteredProps.filter(p=>p.durum==="tamamlandı").length>0&&(
              <div style={{marginTop:8}}>
                <button onClick={()=>setShowDone(v=>!v)} style={{width:"100%",background:B.greenLight,border:`1px solid #b8e0d4`,borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"inherit",fontWeight:700,color:B.green,fontSize:13}}>
                  <span>✅ Tamamlananlar ({filteredProps.filter(p=>p.durum==="tamamlandı").length} firma)</span>
                  <span style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:12}}>₺{fmtN(filteredProps.filter(p=>p.durum==="tamamlandı").reduce((s,p)=>s+(toTRY(p.amount,p.currency)||0),0))}</span>
                    <span>{showDone?"▲":"▼"}</span>
                  </span>
                </button>
                {showDone&&filteredProps.filter(p=>p.durum==="tamamlandı").map(p=>{
                  const tryV=toTRY(p.amount,p.currency,p.lastContact);
                  return <div key={p.id} style={{background:B.greenLight+"90",border:`1px solid #b8e0d440`,borderLeft:`3px solid ${B.green}`,borderRadius:10,padding:"9px 12px",marginTop:5,cursor:"pointer"}} onClick={()=>setSelP(selP?.id===p.id?null:p)}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.firma}</div>
                        <div style={{fontSize:11,color:B.muted}}>{p.yetkili} · {fmtD(p.lastContact)}</div>
                      </div>
                      {p.amount>0&&<div style={{textAlign:"right"}}>
                        <div style={{fontWeight:800,fontSize:12,color:B.green}}>{SYM[p.currency]}{fmtN(p.amount)}</div>
                        {p.currency!=="TRY"&&tryV>0&&<div style={{fontSize:10,color:B.muted}}>₺{fmtN(tryV)} · €{fmtN(tryV/fx.EUR||0)}</div>}
                      </div>}
                    </div>
                    <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}><SvcBadge svc={p.service}/><Chip label={p.assignee.split(" ")[0]} color={AC[p.assignee]||B.muted} sm/></div>
                  </div>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selP&&<Card style={{flex:1,overflow:"auto",padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div style={{flex:1,minWidth:0}}>
              {editingProp
                ? <input style={INP({fontSize:16,fontWeight:800,color:B.navy,width:"100%",marginBottom:6})} value={editPropData.firma||""} onChange={e=>setEditPropData(p=>({...p,firma:e.target.value}))}/>
                : <div style={{fontWeight:800,fontSize:18,color:B.navy}}>{selP.firma}</div>
              }
              {editingProp
                ? <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <input style={INP({flex:1,minWidth:100,fontSize:12})} value={editPropData.yetkili||""} onChange={e=>setEditPropData(p=>({...p,yetkili:e.target.value}))} placeholder="Yetkili"/>
                    <input style={INP({flex:1,minWidth:90,fontSize:12})} value={editPropData.sehir||""} onChange={e=>setEditPropData(p=>({...p,sehir:e.target.value}))} placeholder="Şehir"/>
                    <input style={INP({flex:1,minWidth:110,fontSize:12})} value={editPropData.ref||""} onChange={e=>setEditPropData(p=>({...p,ref:e.target.value}))} placeholder="Referans"/>
                  </div>
                : <div style={{color:B.muted,fontSize:13,marginTop:3}}>{selP.yetkili}{selP.sehir?` · ${selP.sehir}`:""}{selP.ref&&<span style={{color:B.dim}}> · Ref: {selP.ref}</span>}</div>
              }
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
              {editingProp
                ? <><Btn sm color={B.green} onClick={()=>{ upProp(selP.id,editPropData); setEditingProp(false); toast_("✅ Güncellendi"); }}>Kaydet</Btn>
                    <Btn sm outline color={B.muted} onClick={()=>setEditingProp(false)}>İptal</Btn></>
                : <><button style={{background:B.navyLight,border:`1px solid ${B.border}`,color:B.navy,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}} onClick={()=>{ setEditingProp(true); setEditPropData({...selP}); }}>✏️ Düzenle</button>
                    <button style={{background:B.purpleLight,border:`1px solid ${B.purple}40`,color:B.purple,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}} onClick={()=>dupProp(selP)}>📋 Kopyala</button></>
              }
              <button style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:22}} onClick={()=>{ setSelP(null); setEditingProp(false); }}>×</button>
            </div>
          </div>
          {/* Amount — tüm kurlar */}
          <div style={{background:B.navyLight,borderRadius:10,padding:"12px 16px",marginBottom:14}}>
            <Lbl c="Teklif Tutarı & Son Temas"/>
            {editingProp
              ? <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input type="number" style={INP({flex:2,minWidth:100})} value={editPropData.amount||""} onChange={e=>setEditPropData(p=>({...p,amount:parseFloat(e.target.value)||0}))} placeholder="Tutar"/>
                  <select style={SEL({flex:1,minWidth:80})} value={editPropData.currency||"TRY"} onChange={e=>setEditPropData(p=>({...p,currency:e.target.value}))}>{["TRY","EUR","USD"].map(c=><option key={c}>{c}</option>)}</select>
                  <input type="date" style={INP({flex:2,minWidth:130})} value={editPropData.lastContact||""} onChange={e=>setEditPropData(p=>({...p,lastContact:e.target.value}))}/>
                </div>
              : <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                  {selP.amount>0
                    ? <>
                        <div style={{fontWeight:800,fontSize:22,color:B.navy}}>{SYM[selP.currency]}{fmtN(selP.amount)}</div>
                        {selP.currency!=="TRY"&&<div><div style={{fontSize:10,color:B.muted}}>TRY (güncel kur)</div><div style={{fontWeight:700,color:B.green,fontSize:16}}>₺{fmtN(toTRY(selP.amount,selP.currency))}</div></div>}
                        {selP.currency!=="EUR"&&fx.EUR&&<div><div style={{fontSize:10,color:B.muted}}>EUR</div><div style={{fontWeight:700,color:B.muted,fontSize:14}}>€{fmtN(toTRY(selP.amount,selP.currency)/fx.EUR)}</div></div>}
                        {selP.currency!=="USD"&&fx.USD&&<div><div style={{fontSize:10,color:B.muted}}>USD</div><div style={{fontWeight:700,color:B.muted,fontSize:14}}>${fmtN(toTRY(selP.amount,selP.currency)/fx.USD)}</div></div>}
                      </>
                    : <div style={{color:B.dim,fontSize:13}}>Tutar girilmemiş — Düzenle</div>
                  }
                  <div style={{marginLeft:"auto",textAlign:"right"}}>
                    <div style={{fontSize:10,color:B.muted}}>Son temas</div>
                    <div style={{fontWeight:700,color:daysSince(selP.lastContact)>=30?B.red:B.navy}}>{selP.lastContact||"—"}</div>
                    {selP.lastContact&&<div style={{fontSize:10,color:B.dim}}>{daysSince(selP.lastContact)} gün önce</div>}
                  </div>
                </div>
            }
          </div>
          <div style={{marginBottom:12}}><Lbl c="Durum"/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {Object.entries(durumCfg).map(([d,cfg])=><button key={d} onClick={()=>upProp(selP.id,{durum:d})} style={{background:selP.durum===d?cfg.text:"#fff",color:selP.durum===d?"#fff":cfg.text,border:`1.5px solid ${cfg.border}`,borderRadius:20,padding:"4px 11px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{cfg.label}</button>)}
            </div>
          </div>
          <div style={{marginBottom:12}}><Lbl c="Hizmet"/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {SERVICES.map(s=><button key={s} onClick={()=>upProp(selP.id,{service:s})} style={{background:selP.service===s?(SVC_C[s]?.dot||B.navy):"#fff",color:selP.service===s?"#fff":(SVC_C[s]?.text||B.muted),border:`1px solid ${(SVC_C[s]?.dot||B.border)}40`,borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}
            </div>
          </div>
          <div style={{marginBottom:12}}><Lbl c="Atanan"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {assignees.map(a=><button key={a} onClick={()=>upProp(selP.id,{assignee:a})} style={{background:selP.assignee===a?(AC[a]||B.navy):"#fff",color:selP.assignee===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a}</button>)}
            </div>
          </div>
          <div style={{marginBottom:14}}><Lbl c="Not Ekle"/>
            <div style={{display:"flex",gap:8}}>
              <input style={INP({flex:1})} placeholder={`${TODAY}: ne oldu?`} value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()}/>
              <Btn color={B.gold} onClick={addNote}>Kaydet</Btn>
            </div>
          </div>
          <div style={{marginBottom:14}}><Lbl c="Aktivite Geçmişi"/>
            {selP.notes?<div style={{background:B.bg,borderRadius:10,padding:12}}>
              {selP.notes.split("\n").filter(Boolean).map((line,i,arr)=>{
                const m=line.match(/^(\d{4}-\d{2}-\d{2}):/);
                return <div key={i} style={{padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${B.border}`:"none",lineHeight:1.5}}>
                  {m?<><span style={{fontSize:10,background:B.navy,color:B.gold,borderRadius:4,padding:"1px 7px",fontWeight:800,marginRight:8}}>{m[1]}</span><span style={{fontSize:13}}>{line.slice(12)}</span></>:<span style={{fontSize:13,color:B.muted}}>{line}</span>}
                </div>;
              })}
            </div>:<div style={{color:B.dim,fontSize:12}}>Henüz not yok.</div>}
          </div>
          <Btn sm outline color={B.red} onClick={()=>{ if(confirm("Bu teklifi silmek istiyor musunuz?")){ setProposals(proposals.filter(p=>p.id!==selP.id)); setSelP(null); setEditingProp(false); toast_("🗑️ Teklif silindi"); } }}>🗑️ Teklifi Sil</Btn>
        </Card>}

        {/* Add Proposal Modal */}
        {addPropOpen&&<Modal onClose={()=>setAddPropOpen(false)}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:16}}>+ Yeni Teklif</div>
          {[["Firma Adı *","firma"],["Yetkili","yetkili"],["Referans","ref"],["Şehir","sehir"]].map(([l,k])=>(
            <div key={k} style={{marginBottom:11}}><Lbl c={l}/><input style={INP({width:"100%"})} value={newProp[k]} onChange={e=>setNewProp(prev=>({...prev,[k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:2}}><Lbl c="Tutar"/><input type="number" style={INP({width:"100%"})} value={newProp.amount} onChange={e=>setNewProp(prev=>({...prev,amount:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="Kur"/><select style={SEL({width:"100%"})} value={newProp.currency} onChange={e=>setNewProp(prev=>({...prev,currency:e.target.value}))}>{["EUR","USD","TRY"].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          {newProp.amount&&newProp.currency!=="TRY"&&<div style={{background:B.greenLight,borderRadius:8,padding:"7px 12px",marginBottom:11,fontSize:13,color:B.green,fontWeight:700}}>
            ₺{fmtN((parseFloat(newProp.amount||0))*fx[newProp.currency]||0)} · €{fmtN(parseFloat(newProp.amount||0)*(newProp.currency==="USD"?fx.USD/fx.EUR:1))} · ${fmtN(parseFloat(newProp.amount||0)*(newProp.currency==="EUR"?fx.EUR/fx.USD:1))}
          </div>}
          <div style={{marginBottom:11}}><Lbl c="Hizmet"/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {SERVICES.map(s=><button key={s} onClick={()=>setNewProp(prev=>({...prev,service:s}))} style={{background:newProp.service===s?B.navy:"#fff",color:newProp.service===s?"#fff":B.muted,border:`1px solid ${newProp.service===s?B.navy:B.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}
            </div>
          </div>
          <div style={{marginBottom:11}}><Lbl c="Durum"/><select style={SEL({width:"100%"})} value={newProp.durum} onChange={e=>setNewProp(prev=>({...prev,durum:e.target.value}))}>{Object.keys(durumCfg).map(o=><option key={o}>{o}</option>)}</select></div>
          <div style={{marginBottom:11}}><Lbl c="Atanan"/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {assignees.map(a=><button key={a} onClick={()=>setNewProp(prev=>({...prev,assignee:a}))} style={{background:newProp.assignee===a?(AC[a]||B.navy):"#fff",color:newProp.assignee===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a}</button>)}
            </div>
          </div>
          <div style={{marginBottom:16}}><Lbl c="Not"/><textarea style={{...INP({width:"100%",height:70,resize:"vertical"})}} value={newProp.notes} onChange={e=>setNewProp(prev=>({...prev,notes:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8}}><Btn onClick={addProp}>Kaydet</Btn><Btn outline color={B.muted} onClick={()=>setAddPropOpen(false)}>İptal</Btn></div>
        </Modal>}

        {/* Durum Yönetimi Modal */}
        {manageDurum&&<Modal onClose={()=>setManageDurum(false)}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:16}}>⚙️ Durum Etiketleri Yönet</div>
          <div style={{marginBottom:16}}>
            {Object.entries(durumCfg).map(([key,cfg])=>(
              <div key={key} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${B.border}`}}>
                <DurumBadge d={key} cfg={durumCfg}/>
                <div style={{flex:1,fontSize:12,color:B.muted}}>{key}</div>
                <button onClick={()=>{ const u={...durumCfg}; delete u[key]; setDurumCfg(u); toast_("🗑️ Durum silindi"); }} style={{background:"transparent",border:"none",color:B.red,cursor:"pointer",fontSize:14}}>×</button>
              </div>
            ))}
          </div>
          <Lbl c="Yeni Durum Ekle"/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input style={INP({flex:1})} placeholder="Anahtar (ör: müzakere)" value={newDurumKey} onChange={e=>setNewDurumKey(e.target.value.toLowerCase().replace(/\s/g,""))}/>
            <input style={INP({flex:2})} placeholder="Etiket (ör: 💬 Müzakere)" value={newDurumLabel} onChange={e=>setNewDurumLabel(e.target.value)}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{
              if(!newDurumKey||!newDurumLabel) return;
              setDurumCfg({...durumCfg,[newDurumKey]:{label:newDurumLabel,bg:B.navyLight,text:B.navy,border:B.border}});
              setNewDurumKey(""); setNewDurumLabel(""); toast_("✅ Durum eklendi");
            }}>Ekle</Btn>
            <Btn outline color={B.muted} onClick={()=>{ setDurumCfg(DEFAULT_DURUM_CFG); toast_("↩️ Varsayılana döndürüldü"); }}>Varsayılana Dön</Btn>
            <Btn outline color={B.muted} onClick={()=>setManageDurum(false)}>Kapat</Btn>
          </div>
        </Modal>}
      </div>}

      {/* ══ TASKS ══ */}
      {tab==="tasks"&&<div>
        <Card style={{marginBottom:14,padding:14}}>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{fontWeight:800,color:B.navy,flex:1}}>Görev Yönetimi <span style={{fontSize:11,fontWeight:400,color:B.muted}}>· {currentUser}</span></div>
            {["all",...assignees].map(a=><button key={a} onClick={()=>setTaskAsnF(a)} style={{background:taskAsnF===a?(AC[a]||B.navy):"#fff",color:taskAsnF===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}40`,borderRadius:20,padding:"4px 11px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a==="all"?"Herkes":a.split(" ")[0]} ({a==="all"?openTasks.length:openTasks.filter(t=>t.assignee===a).length})</button>)}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
            <input style={INP({flex:3,minWidth:200})} placeholder="Yeni görev... (Enter ile ekle)" value={newTaskText} onChange={e=>setNewTaskText(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!showTaskDetail) addTask(); }}/>
            <select style={SEL({flex:1,minWidth:100})} value={newTaskCat} onChange={e=>setNewTaskCat(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            <select style={SEL({width:140})} value={newTaskAsn} onChange={e=>setNewTaskAsn(e.target.value)}>
              {(isAdmin?assignees:[currentUser||"Ergin Polat"]).map(a=><option key={a}>{a}</option>)}
            </select>
            <Btn onClick={addTask}>+ Ekle</Btn>
            <Btn sm outline color={showTaskDetail?B.navy:B.muted} onClick={()=>setShowTaskDetail(v=>!v)}>⊕ Detay</Btn>
          </div>
          {showTaskDetail&&<div style={{background:B.navyLight,borderRadius:10,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:800,color:B.navy,marginBottom:10}}>📋 Detaylı Görev Bilgileri</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <div style={{flex:2,minWidth:160}}><Lbl c="Konu"/><input style={INP({width:"100%"})} placeholder="Ne konuşulacak..." value={newTaskExtra.konu} onChange={e=>setNewTaskExtra(p=>({...p,konu:e.target.value}))}/></div>
              <div style={{flex:1,minWidth:130}}><Lbl c="Hedef Tarih"/><input type="date" style={INP({width:"100%"})} value={newTaskExtra.hedefTarih} onChange={e=>setNewTaskExtra(p=>({...p,hedefTarih:e.target.value}))}/></div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <div style={{flex:1,minWidth:140}}><Lbl c="Firma"/><input style={INP({width:"100%"})} value={newTaskExtra.firma} onChange={e=>setNewTaskExtra(p=>({...p,firma:e.target.value}))}/></div>
              <div style={{flex:1,minWidth:140}}><Lbl c="İlgili Kişi"/><input style={INP({width:"100%"})} value={newTaskExtra.ilgiliKisi} onChange={e=>setNewTaskExtra(p=>({...p,ilgiliKisi:e.target.value}))}/></div>
              <div style={{flex:1,minWidth:140}}><Lbl c="Telefon"/><input style={INP({width:"100%"})} value={newTaskExtra.telefon} onChange={e=>setNewTaskExtra(p=>({...p,telefon:e.target.value}))}/></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={addTask} color={B.green}>✅ Kaydet</Btn>
              <Btn sm outline color={B.muted} onClick={()=>{ setShowTaskDetail(false); setNewTaskExtra({hedefTarih:"",telefon:"",firma:"",ilgiliKisi:"",konu:""}); }}>İptal</Btn>
            </div>
          </div>}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:B.navyLight,borderRadius:8,fontSize:12}}>
            <span>📤 Toplu yükle (CSV):</span>
            <input ref={taskXlsRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ importTasksXLS(e.target.files[0]); e.target.value=""; } }}/>
            <Btn sm outline color={B.navy} onClick={()=>taskXlsRef.current?.click()}>CSV Seç</Btn>
            <span style={{color:B.muted}}>Sütunlar: <b>Görev</b>, Kategori, Atanan</span>
          </div>
        </Card>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {CATS.map(cat=>{
            const items=tasks.filter(t=>!t.done&&t.category===cat&&(taskAsnF==="all"||t.assignee===taskAsnF));
            if(!items.length) return null;
            const cc=CAT_C[cat]||B.muted;
            return <Card key={cat} style={{minWidth:220,flex:1,padding:14,borderTop:`3px solid ${cc}`}}>
              <div style={{fontSize:11,fontWeight:800,color:cc,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>{cat} ({items.length})</div>
              {items.map(t=>(
                <div key={t.id} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 0",borderBottom:`1px solid ${B.border}`,opacity:fadingTasks[t.id]?0:1,transition:"opacity 0.6s",background:fadingTasks[t.id]?B.greenLight+"50":"transparent"}}>
                  <input type="checkbox" checked={false} onChange={()=>setTaskAction({id:t.id,task:t})} style={{marginTop:2,accentColor:cc,flexShrink:0,width:14,height:14,cursor:"pointer"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,lineHeight:1.4,fontWeight:600,textDecoration:fadingTasks[t.id]?"line-through":"none"}}>{t.text}</div>
                    {t.konu&&<div style={{fontSize:11,color:B.muted,marginTop:1}}>📌 {t.konu}</div>}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:3,alignItems:"center"}}>
                      {t.firma&&<span style={{fontSize:10,color:B.navy,fontWeight:600}}>🏢 {t.firma}</span>}
                      {t.ilgiliKisi&&<span style={{fontSize:10,color:B.muted}}>👤 {t.ilgiliKisi}</span>}
                      {t.telefon&&<span style={{fontSize:10,color:B.green}}>📞 {t.telefon}</span>}
                      {t.hedefTarih&&<span style={{fontSize:10,color:daysSince(t.hedefTarih)<0?B.red:B.amber,fontWeight:700}}>📅 {fmtD(t.hedefTarih)}</span>}
                      <Chip label={t.assignee.split(" ")[0]} color={AC[t.assignee]||B.muted} sm/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {/* Takvime ekle */}
                    {t.hedefTarih&&<button title="Outlook/Takvim'e ekle (.ics)" onClick={()=>downloadICS(t)} style={{background:"transparent",border:"none",color:B.muted,cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>📅</button>}
                    {/* Düzenle */}
                    <button title="Düzenle" onClick={()=>setEditingTask({...t})} style={{background:"transparent",border:"none",color:B.muted,cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>✏️</button>
                    {/* Sil */}
                    <button style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:16,padding:0,lineHeight:1}} onClick={()=>delTask(t.id)}>×</button>
                  </div>
                </div>
              ))}
            </Card>;
          })}
        </div>
        {tasks.filter(t=>t.done).length>0&&<Card style={{marginTop:14,opacity:.6,padding:14}}>
          <div style={{fontSize:11,fontWeight:800,color:B.green,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>✅ Tamamlananlar ({tasks.filter(t=>t.done).length})</div>
          {tasks.filter(t=>t.done).slice(0,8).map(t=><div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${B.border}`}}>
            <input type="checkbox" checked onChange={()=>togTask(t.id)} style={{accentColor:B.green}}/>
            <div style={{flex:1,fontSize:12,color:B.dim,textDecoration:"line-through"}}>{t.text}</div>
            <span style={{fontSize:11,color:B.dim}}>{t.assignee.split(" ")[0]}</span>
            <button style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:14}} onClick={()=>delTask(t.id)}>×</button>
          </div>)}
        </Card>}

        {/* Görev Aksiyon Modal */}
        {taskAction&&<Modal onClose={()=>{ setTaskAction(null); setTaskActionNote(""); }}>
          <div style={{fontWeight:800,fontSize:15,color:B.navy,marginBottom:4}}>✅ Görev Güncelle</div>
          <div style={{fontSize:13,color:B.muted,marginBottom:14,background:B.navyLight,borderRadius:8,padding:"8px 12px"}}>{taskAction.task.text}</div>
          <Lbl c="Not (opsiyonel)"/>
          <input style={INP({width:"100%",marginBottom:14})} placeholder={`${TODAY}: ne oldu?`} value={taskActionNote} onChange={e=>setTaskActionNote(e.target.value)}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn color={B.green} onClick={()=>{
              if(taskActionNote.trim()){
                const upd=`${TODAY}: ${taskActionNote.trim()}\n${taskAction.task.notes||""}`;
                setTasks(tasks.map(t=>t.id===taskAction.task.id?{...t,notes:upd}:t));
              }
              togTask(taskAction.task.id); setTaskAction(null); setTaskActionNote(""); toast_("✅ Tamamlandı");
            }}>✅ Tamamlandı</Btn>
            <Btn color={B.gold} outline onClick={()=>{
              if(!taskActionNote.trim()) return;
              const upd=`${TODAY}: ${taskActionNote.trim()}\n${taskAction.task.notes||""}`;
              setTasks(tasks.map(t=>t.id===taskAction.task.id?{...t,notes:upd}:t));
              setTaskAction(null); setTaskActionNote(""); toast_("📝 Not eklendi");
            }}>📝 Not Ekle (Açık Kalsın)</Btn>
            <Btn outline color={B.muted} onClick={()=>{ setTaskAction(null); setTaskActionNote(""); }}>İptal</Btn>
          </div>
        </Modal>}
        {/* Görev Düzenleme Modal */}
        {editingTask&&<Modal onClose={()=>setEditingTask(null)}>
          <div style={{fontWeight:800,fontSize:15,color:B.navy,marginBottom:14}}>✏️ Görevi Düzenle</div>
          <div style={{marginBottom:11}}><Lbl c="Görev Metni"/>
            <input style={INP({width:"100%"})} value={editingTask.text} onChange={e=>setEditingTask(p=>({...p,text:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:1}}><Lbl c="Kategori"/>
              <select style={SEL({width:"100%"})} value={editingTask.category} onChange={e=>setEditingTask(p=>({...p,category:e.target.value}))}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{flex:1}}><Lbl c="Atanan"/>
              <select style={SEL({width:"100%"})} value={editingTask.assignee} onChange={e=>setEditingTask(p=>({...p,assignee:e.target.value}))}>
                {(isAdmin?assignees:[currentUser]).map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:1}}><Lbl c="Firma"/><input style={INP({width:"100%"})} value={editingTask.firma||""} onChange={e=>setEditingTask(p=>({...p,firma:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="Hedef Tarih"/><input type="date" style={INP({width:"100%"})} value={editingTask.hedefTarih||""} onChange={e=>setEditingTask(p=>({...p,hedefTarih:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            <div style={{flex:1}}><Lbl c="İlgili Kişi"/><input style={INP({width:"100%"})} value={editingTask.ilgiliKisi||""} onChange={e=>setEditingTask(p=>({...p,ilgiliKisi:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="Telefon"/><input style={INP({width:"100%"})} value={editingTask.telefon||""} onChange={e=>setEditingTask(p=>({...p,telefon:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn color={B.green} onClick={()=>{
              setTasks(tasks.map(t=>t.id===editingTask.id?{...editingTask}:t));
              setEditingTask(null); toast_("✅ Görev güncellendi");
            }}>Kaydet</Btn>
            <Btn outline color={B.muted} onClick={()=>setEditingTask(null)}>İptal</Btn>
          </div>
        </Modal>}
      {tab==="mali"&&<div>
        <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontWeight:800,color:B.navy,fontSize:15}}>💰 Mali Tablo</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {availableYears.map(y=><button key={y} onClick={()=>setMaliYil(y)} style={{background:maliYil===y?B.navy:"#fff",color:maliYil===y?"#fff":B.muted,border:`1px solid ${maliYil===y?B.navy:B.border}`,borderRadius:8,padding:"5px 14px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{y}</button>)}
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {["faturalar","giderler","vergi"].map(s=><button key={s} onClick={()=>setMaliSub(s)} style={{background:maliSub===s?B.navy:"#fff",color:maliSub===s?"#fff":B.muted,border:`1px solid ${maliSub===s?B.navy:B.border}`,borderRadius:20,padding:"5px 16px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
              {s==="faturalar"?"📄 Kesilen Faturalar":s==="giderler"?"🧾 Giderler & Fişler":"📊 Vergi Özeti"}
            </button>)}
          </div>
        </div>

        {/* KESİLEN FATURALAR */}
        {maliSub==="faturalar"&&<div>
          <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"flex-start"}}>
            <KpiCard l="Gelir (KDV hariç)" v={"₺"+fmtN(invTRY)} sub={`€${fmtN(invTRY/(fx.EUR||50.82))} · $${fmtN(invTRY/(fx.USD||44.25))}`} c={B.navy}/>
            <KpiCard l="Tahsil Edilen KDV" v={"₺"+fmtN(invKdv)} sub={`€${fmtN(invKdv/(fx.EUR||50.82))}`} c={B.amber}/>
            <KpiCard l="Toplam (KDV dahil)" v={"₺"+fmtN(invTRY+invKdv)} sub={`${kesilenInv.length} fatura`} c={B.green}/>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <Btn onClick={()=>setAddInvOpen(true)}>+ Fatura Ekle</Btn>
              <input ref={invFileRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ toast_("📎 Fatura dosyası eklendi (görüntüleme yakında)"); e.target.value=""; } }}/>
              <Btn sm outline color={B.navy} onClick={()=>invFileRef.current?.click()}>📎 Fatura Yükle (PDF/JPG)</Btn>
            </div>
          </div>
          <div style={{background:B.navyLight,borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:11,color:B.navy}}>
            💡 EUR/USD faturalar o günkü TCMB kuruyla TRY'ye çevrilir. ✓ = gerçek kur, ~ = güncel kur.
          </div>
          <div style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:12,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
              <thead><tr style={{background:B.navy,color:"#fff"}}>
                {["Tarih","Firma","Hizmet","KDV Hariç","Kur","TRY","EUR","USD","KDV%","KDV TRY","Toplam",""].map((h,i)=><th key={i} style={{padding:"7px 9px",textAlign:"left",fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {kesilenInv.sort((a,b)=>b.tarih.localeCompare(a.tarih)).map((f,i)=>{
                  const rKey=`${f.tarih}_${f.currency}`; const hist=rateCache[rKey];
                  const rate=f.currency==="TRY"?1:(hist||fx[f.currency]||null);
                  const tryB=rate?Math.round(f.tutarKdvHaric*rate):null;
                  const kdvT=tryB?Math.round(tryB*(f.kdvOrani/100)):null;
                  const eurB=tryB&&fx.EUR?Math.round(tryB/fx.EUR):null;
                  const usdB=tryB&&fx.USD?Math.round(tryB/fx.USD):null;
                  return <tr key={f.id} style={{background:i%2===0?"#fff":B.bg}}>
                    <td style={{padding:"7px 9px",color:B.muted,fontSize:11,whiteSpace:"nowrap"}}>{fmtD(f.tarih)}</td>
                    <td style={{padding:"7px 9px",fontWeight:700}}>{f.firma}</td>
                    <td style={{padding:"7px 9px"}}><SvcBadge svc={f.service}/></td>
                    <td style={{padding:"7px 9px",fontWeight:700,whiteSpace:"nowrap"}}>{SYM[f.currency]}{fmtN(f.tutarKdvHaric)}</td>
                    <td style={{padding:"7px 9px",fontSize:11,color:hist?B.green:B.dim,whiteSpace:"nowrap"}}>{f.currency==="TRY"?"—":rate?`₺${rate.toFixed(2)}${hist?"✓":"~"}`:"⏳"}</td>
                    <td style={{padding:"7px 9px",fontWeight:700,color:B.navy,whiteSpace:"nowrap"}}>₺{tryB?fmtN(tryB):"—"}</td>
                    <td style={{padding:"7px 9px",fontSize:11,color:B.muted}}>€{eurB?fmtN(eurB):"—"}</td>
                    <td style={{padding:"7px 9px",fontSize:11,color:B.muted}}>${usdB?fmtN(usdB):"—"}</td>
                    <td style={{padding:"7px 9px",color:B.muted}}>%{f.kdvOrani}</td>
                    <td style={{padding:"7px 9px",color:B.amber,fontWeight:700}}>₺{kdvT?fmtN(kdvT):"—"}</td>
                    <td style={{padding:"7px 9px",fontWeight:800,color:B.green,whiteSpace:"nowrap"}}>₺{tryB&&kdvT?fmtN(tryB+kdvT):"—"}</td>
                    <td style={{padding:"7px 9px"}}><button onClick={()=>setInvoices(invoices.filter(x=>x.id!==f.id))} style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:14}}>×</button></td>
                  </tr>;
                })}
              </tbody>
              <tfoot><tr style={{background:B.navy,color:"#fff"}}>
                <td colSpan={5} style={{padding:"9px",fontWeight:800,fontSize:12}}>TOPLAM ({maliYil})</td>
                <td style={{padding:"9px",fontWeight:800,fontSize:13}}>₺{fmtN(invTRY)}</td>
                <td style={{padding:"9px",fontWeight:700}}>€{fmtN(invTRY/(fx.EUR||50.82))}</td>
                <td style={{padding:"9px",fontWeight:700}}>${fmtN(invTRY/(fx.USD||44.25))}</td>
                <td/>
                <td style={{padding:"9px",fontWeight:800,color:B.gold}}>₺{fmtN(invKdv)}</td>
                <td style={{padding:"9px",fontWeight:800,color:B.gold}}>₺{fmtN(invTRY+invKdv)}</td>
                <td/>
              </tr></tfoot>
            </table>
          </div>
        </div>}

        {/* GİDERLER */}
        {maliSub==="giderler"&&<div>
          <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"flex-start"}}>
            <KpiCard l="Gider (KDV hariç)" v={"₺"+fmtN(expTotal)} c={B.red}/>
            <KpiCard l="İndirilecek KDV" v={"₺"+fmtN(expKdv)} c={B.green}/>
            <KpiCard l="Net Ödenecek KDV" v={"₺"+fmtN(netKdv)} sub="Tahsil − İndirim" c={B.amber}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn onClick={()=>setAddExpOpen(true)}>+ Gider Ekle</Btn>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ scanReceipt(e.target.files[0]); e.target.value=""; } }}/>
              <Btn color={B.gold} outline sm onClick={()=>fileRef.current?.click()}>📷 Fiş Tara (AI)</Btn>
            </div>
          </div>
          {expYear.length===0&&<div style={{background:B.goldLight,borderRadius:12,padding:32,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📷</div>
            <div style={{fontWeight:700,color:B.navy,marginBottom:4}}>Fiş ve adıma kesilen faturaları buraya ekle</div>
            <div style={{fontSize:12,color:B.muted,marginBottom:16}}>KDV otomatik — yakıt %20, gıda %1, restoran %10, ulaşım %10</div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <Btn color={B.gold} onClick={()=>fileRef.current?.click()}>📷 Fiş Fotoğrafı (AI okur)</Btn>
              <Btn color={B.navy} outline onClick={()=>setAddExpOpen(true)}>+ Manuel Gir</Btn>
            </div>
          </div>}
          {expYear.length>0&&<div style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:12,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
              <thead><tr style={{background:B.navy,color:"#fff"}}>{["Tarih","Açıklama","Kategori","KDV Dahil","KDV%","İnd. KDV","KDV Hariç",""].map((h,i)=><th key={i} style={{padding:"7px 9px",textAlign:"left",fontSize:9,textTransform:"uppercase",fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>
                {expYear.sort((a,b)=>b.tarih.localeCompare(a.tarih)).map((e,i)=>{
                  const net=e.tutarKdvDahil/(1+e.kdvOrani/100); const kdv=e.tutarKdvDahil-net;
                  return <tr key={e.id} style={{background:i%2===0?"#fff":B.bg}}>
                    <td style={{padding:"7px 9px",color:B.muted,fontSize:11}}>{fmtD(e.tarih)}</td>
                    <td style={{padding:"7px 9px",fontWeight:600}}>{e.aciklama}</td>
                    <td style={{padding:"7px 9px"}}><span style={{background:B.navyLight,color:B.navy,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{e.kategori}</span></td>
                    <td style={{padding:"7px 9px",fontWeight:700}}>₺{fmtN(e.tutarKdvDahil)}</td>
                    <td style={{padding:"7px 9px",color:B.muted}}>%{e.kdvOrani}</td>
                    <td style={{padding:"7px 9px",color:B.green,fontWeight:700}}>₺{fmtN(kdv)}</td>
                    <td style={{padding:"7px 9px"}}>₺{fmtN(net)}</td>
                    <td style={{padding:"7px 9px"}}><button onClick={()=>setExpenses(expenses.filter(x=>x.id!==e.id))} style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:14}}>×</button></td>
                  </tr>;
                })}
              </tbody>
              <tfoot><tr style={{background:B.navy,color:"#fff"}}>
                <td colSpan={3} style={{padding:"9px",fontWeight:800}}>TOPLAM</td>
                <td style={{padding:"9px",fontWeight:800}}>₺{fmtN(expYear.reduce((s,e)=>s+e.tutarKdvDahil,0))}</td>
                <td/><td style={{padding:"9px",fontWeight:800,color:B.gold}}>₺{fmtN(expKdv)}</td>
                <td style={{padding:"9px",fontWeight:800}}>₺{fmtN(expTotal)}</td><td/>
              </tr></tfoot>
            </table>
          </div>}
        </div>}

        {/* VERGİ ÖZETİ */}
        {maliSub==="vergi"&&<div>
          <div style={{background:B.navyLight,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:12,color:B.navy}}>
            🏛️ <b>{MUK.ad}</b> · VKN: {MUK.vkn} · {MUK.vd} V.D. · Şahıs Şirketi · Yıllık Beyan · {maliYil}
            <br/><span style={{fontSize:11,color:B.muted}}>Asgari ücretli 1 çalışan (Aralık 2024'ten itibaren) · SGK 4/b Bağ-Kur (şahıs) · 2026 GV dilimleri</span>
          </div>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KpiCard l="Gelir (KDV hariç)" v={"₺"+fmtN(invTRY)} sub={`€${fmtN(invTRY/(fx.EUR||50.82))} · $${fmtN(invTRY/(fx.USD||44.25))}`} c={B.navy}/>
            <KpiCard l="Gider (KDV hariç)" v={"₺"+fmtN(expTotal)} sub="matrahtan düşülür" c={B.red}/>
            <KpiCard l="Vergi Matrahı" v={"₺"+fmtN(vergiMat)} sub={`€${fmtN(vergiMat/(fx.EUR||50.82))}`} c={B.navy}/>
            <KpiCard l="Gelir Vergisi" v={"₺"+fmtN(tahmGV)} sub={`${yilNum} dilimli`} c={B.red}/>
            <KpiCard l="Net KDV" v={"₺"+fmtN(netKdv)} sub="Tahsil − İndirim" c={B.amber}/>
            <KpiCard l="SGK Bağ-Kur" v={"₺"+fmtN(sgkBagKur)} sub={`${sgkAylar}ay × ₺${fmtN(SGK_BAG_KUR_AYLIK)}`} c={B.purple}/>
            <KpiCard l="SGK İşveren" v={"₺"+fmtN(sgkIsverenYillik)} sub={`${calısanAylar} ay, asgari ücretli`} c={B.purple}/>
            <KpiCard l="Damga Vergisi" v={"₺"+fmtN(damgaV)} sub="%0.759" c={B.muted}/>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
            <Card style={{flex:1,minWidth:280,borderTop:`4px solid ${B.red}`}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>💸 Toplam Yük & Net Kalan</div>
              {[
                ["Gelir Vergisi (yıllık beyan)",tahmGV,B.navy,"GVK 103: %15→%40 (2026)"],
                ["Geçici Vergi (çeyrek başına)",geciciV,B.navyMid,"Yıllık GV / 4 taksit"],
                ["Net KDV (aylık beyan)",netKdv,B.amber,"Tahsil − İndirim"],
                ["SGK Bağ-Kur 4/b",sgkBagKur,B.purple,`${sgkAylar} ay, şahıs`],
                ["SGK İşveren (çalışan)",sgkIsverenYillik,B.purple,`${calısanAylar} ay, asgari ücretli`],
                ["Damga Vergisi",damgaV,B.muted,"Fatura × %0.759"],
                ["","","",""],
                ["TOPLAM YÜK",toplamYuk,B.red,""],
                ["NET KALAN",netKalan,B.green,""],
              ].map(([l,v,c,aciklama],i)=>(
                l?<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<6?`1px solid ${B.border}`:"none"}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:[7,8].includes(i)?800:400,color:B.text}}>{l}</span>
                    {aciklama&&<div style={{fontSize:10,color:B.dim}}>{aciklama}</div>}
                  </div>
                  {v&&<div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:c}}>₺{fmtN(v)}</div>
                    <div style={{fontSize:10,color:B.dim}}>€{fmtN(v/(fx.EUR||50.82))} · ${fmtN(v/(fx.USD||44.25))}</div>
                  </div>}
                </div>:<div key={i} style={{padding:"4px 0",borderBottom:`1px solid ${B.border}`,color:B.dim,fontSize:10}}>─────────────</div>
              ))}
              <div style={{marginTop:12,background:B.greenLight,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,color:B.green,fontSize:13}}>Efektif Vergi Oranı</div>
                  <div style={{fontSize:10,color:B.dim}}>Toplam yük / Gelir</div>
                </div>
                <span style={{fontSize:28,fontWeight:800,color:invTRY>0&&toplamYuk/invTRY>0.5?B.red:B.green}}>%{invTRY>0?Math.round(toplamYuk/invTRY*100):0}</span>
              </div>
            </Card>
            <div style={{flex:1,minWidth:220,display:"flex",flexDirection:"column",gap:12}}>
              <Card>
                <div style={{fontWeight:800,color:B.navy,marginBottom:10,fontSize:13}}>📅 Çalışan Maliyeti ({maliYil})</div>
                {(()=>{
                  const c=calısanMaliyet(yilNum,1);
                  if(!c) return <div style={{fontSize:12,color:B.dim}}>Bu yıl çalışan yok.</div>;
                  return <div style={{fontSize:12}}>
                    {[["Brut Maaş",c.brut],["SGK İşçi payı",c.sgkIsci],["İşsizlik İşçi",c.issizlikIsci],["Damga İşçi",c.damgaIsci],["Net Maaş",c.netIsci,"green"],["─","─"],["SGK İşveren",c.sgkIsveren],["Hazine Desteği",-c.hazineDestegi,"green"],["İşsizlik İşveren",c.issizlikIsveren],["TOPLAM MALİYET",c.toplam,"red"]].map(([l,v,cl],i)=>(
                      v!=="─"?<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${B.border}`}}>
                        <span style={{color:B.muted}}>{l}</span>
                        <span style={{fontWeight:["Net Maaş","TOPLAM MALİYET"].includes(l)?800:400,color:cl==="green"?B.green:cl==="red"?B.red:B.text}}>₺{fmtN(Math.abs(v))}</span>
                      </div>:<div key={i} style={{padding:"2px 0",color:B.dim,fontSize:10}}>──────────</div>
                    ))}
                    <div style={{marginTop:8,fontSize:10,color:B.dim}}>Aylık işveren maliyeti: ₺{fmtN(c.toplam)} · Yıllık: ₺{fmtN(sgkIsverenYillik)}</div>
                  </div>;
                })()}
              </Card>
              <Card>
                <div style={{fontWeight:800,color:B.navy,marginBottom:10,fontSize:13}}>📈 Aylık Gelir</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={aylikChart} margin={{top:0,right:0,bottom:0,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={B.border}/>
                    <XAxis dataKey="name" tick={{fontSize:9,fill:B.muted}}/>
                    <YAxis tick={{fontSize:9,fill:B.muted}} width={40} tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:v}/>
                    <Tooltip contentStyle={{fontFamily:"inherit",fontSize:11,borderRadius:8}} formatter={v=>"₺"+fmtN(v)}/>
                    <Bar dataKey="Gelir" fill={B.navy} radius={[3,3,0,0]}/>
                    <Bar dataKey="Gider" fill={B.red} radius={[3,3,0,0]}/>
                    <Legend wrapperStyle={{fontSize:10}}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
          <div style={{background:B.amberLight,borderRadius:10,padding:"10px 16px",border:`1px solid ${B.gold}40`,fontSize:12,color:B.amber,marginBottom:8}}>
            ⚠️ <b>Tahmini hesaplamadır.</b> Kesin beyan için mali müşavirinize danışın. SGK Bağ-Kur gider olarak matrahtan düşülebilir. Geçici vergi mahsup edilir.
          </div>
          <Btn color={B.navy} onClick={()=>generatePDFReport("mali")}>🖨️ Kurumsal Mali Rapor PDF</Btn>
        </div>}

        {/* Fatura Ekleme Modal */}
        {addInvOpen&&<Modal onClose={()=>setAddInvOpen(false)}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:16}}>📄 Kesilen Fatura Ekle</div>
          {[["Firma/Müşteri *","firma"],["Fatura Notu","faturaNotu"]].map(([l,k])=>(
            <div key={k} style={{marginBottom:11}}><Lbl c={l}/><input style={INP({width:"100%"})} value={newInv[k]} onChange={e=>setNewInv(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div style={{marginBottom:11}}><Lbl c="Fatura Tarihi"/><input type="date" style={INP({width:"100%"})} value={newInv.tarih} onChange={e=>setNewInv(p=>({...p,tarih:e.target.value,kdvOrani:kdvRate(e.target.value)}))}/></div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:2}}><Lbl c="KDV Hariç Tutar *"/><input type="number" style={INP({width:"100%"})} value={newInv.tutarKdvHaric} onChange={e=>setNewInv(p=>({...p,tutarKdvHaric:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="Para Birimi"/><select style={SEL({width:"100%"})} value={newInv.currency} onChange={e=>setNewInv(p=>({...p,currency:e.target.value}))}>{["TRY","EUR","USD"].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:1}}><Lbl c="KDV %"/><select style={SEL({width:"100%"})} value={newInv.kdvOrani} onChange={e=>setNewInv(p=>({...p,kdvOrani:parseInt(e.target.value)}))}>{[0,1,8,10,18,20].map(r=><option key={r}>{r}</option>)}</select></div>
            <div style={{flex:2}}><Lbl c="Hizmet"/><select style={SEL({width:"100%"})} value={newInv.service} onChange={e=>setNewInv(p=>({...p,service:e.target.value}))}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          {newInv.tutarKdvHaric&&<div style={{background:B.greenLight,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:13,color:B.green,fontWeight:700}}>
            KDV: ₺{fmtN(parseFloat(newInv.tutarKdvHaric||0)*(newInv.currency==="TRY"?1:(fx[newInv.currency]||50.82))*(newInv.kdvOrani/100))} · Damga: ₺{fmtN(damgaVergi(parseFloat(newInv.tutarKdvHaric||0)*(newInv.currency==="TRY"?1:(fx[newInv.currency]||50.82))))}
          </div>}
          <div style={{display:"flex",gap:8}}><Btn onClick={addInvoice}>Kaydet</Btn><Btn outline color={B.muted} onClick={()=>setAddInvOpen(false)}>İptal</Btn></div>
        </Modal>}

        {/* Gider Modal */}
        {addExpOpen&&<Modal onClose={()=>{ setAddExpOpen(false); setNewExp({tarih:TODAY,aciklama:"",kategori:"Yakıt",tutarKdvDahil:"",kdvOrani:20}); }}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:4}}>🧾 Gider / Adıma Fatura Ekle {scanningExp&&<span style={{fontSize:12,color:B.gold}}>🤖 AI okuyor...</span>}</div>
          {scanningExp&&<div style={{background:B.goldLight,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:B.amber,textAlign:"center"}}>🤖 Fiş okunuyor...</div>}
          <div style={{marginBottom:11}}><Lbl c="Tarih"/><input type="date" style={INP({width:"100%"})} value={newExp.tarih} onChange={e=>setNewExp(p=>({...p,tarih:e.target.value}))}/></div>
          <div style={{marginBottom:11}}><Lbl c="Açıklama *"/><input style={INP({width:"100%"})} placeholder="Petroil yakıt, Migros, telefon faturası..." value={newExp.aciklama} onChange={e=>setNewExp(p=>({...p,aciklama:e.target.value}))}/></div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:2}}><Lbl c="Tutar (KDV dahil) *"/><input type="number" style={INP({width:"100%"})} value={newExp.tutarKdvDahil} onChange={e=>setNewExp(p=>({...p,tutarKdvDahil:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="KDV %"/><select style={SEL({width:"100%"})} value={newExp.kdvOrani} onChange={e=>setNewExp(p=>({...p,kdvOrani:parseInt(e.target.value)}))}>{[0,1,8,10,18,20].map(r=><option key={r}>{r}</option>)}</select></div>
          </div>
          <div style={{marginBottom:11}}><Lbl c="Kategori"/><select style={SEL({width:"100%"})} value={newExp.kategori} onChange={e=>setNewExp(p=>({...p,kategori:e.target.value,kdvOrani:GIDER_KDV[e.target.value]||20}))}>{GIDER_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          {newExp.tutarKdvDahil&&<div style={{background:B.greenLight,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:13,color:B.green,fontWeight:700}}>
            İndirilecek KDV: ₺{fmtN(parseFloat(newExp.tutarKdvDahil||0)-(parseFloat(newExp.tutarKdvDahil||0)/(1+newExp.kdvOrani/100)))}
          </div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={addExpense} style={{opacity:scanningExp?.5:1}} disabled={scanningExp}>Kaydet</Btn>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ scanReceipt(e.target.files[0]); e.target.value=""; } }}/>
            <Btn color={B.gold} outline onClick={()=>fileRef.current?.click()}>📷 Fiş Tara</Btn>
            <Btn outline color={B.muted} onClick={()=>setAddExpOpen(false)}>İptal</Btn>
          </div>
        </Modal>}
      </div>}

      </div>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:B.navy,color:"#fff",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 6px 24px #1a274440"}}>{toast}</div>}
    </div>
  );
}
