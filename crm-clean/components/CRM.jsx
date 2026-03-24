import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://prpkwdwyptnwhisetuus.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycGt3ZHd5cHRud2hpc2V0dXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjM2MjIsImV4cCI6MjA4OTgzOTYyMn0.BmSoAoghp6XbYKYEs5Yv5yOUJa4Q-BkcrA8SFx3kb2E";

const supa = {
  headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
  async get(table) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/${table}?select=*`, { headers: this.headers });
      return await r.json();
    } catch { return []; }
  },
  async upsert(table, id, data) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
      });
    } catch {}
  },
  async remove(table, id) {
    try {
      await fetch(`${SUPA_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: this.headers });
    } catch {}
  }
};

// ─── BRAND ────────────────────────────────────────────────────────────────────
const B = {
  navy:"#1a2744", navyLight:"#e8ecf4", gold:"#a89060", goldLight:"#f5f0e8",
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
const DURUM_CFG = {
  tamamlandı:{label:"✅ Tamamlandı",bg:B.greenLight,text:B.green,border:"#b8e0d4"},
  bekliyoruz:{label:"⏳ Bekliyoruz",bg:B.amberLight,text:B.amber,border:"#e8d08a"},
  ertelendi:{label:"🔄 Ertelendi",bg:B.purpleLight,text:B.purple,border:"#c8b8e8"},
  kaybedildi:{label:"❌ Kaybedildi",bg:B.redLight,text:B.red,border:"#e8c0bc"},
  durdu:{label:"🛑 Durdu",bg:B.redLight,text:B.red,border:"#e8c0bc"},
  şartlı:{label:"🔒 Şartlı",bg:B.navyLight,text:B.navy,border:"#c0c8e0"},
};
const CATS = ["arama","toplantı","aksiyon","acil","takip","bekle","mesaj","fatura","ziyaret","kişisel"];
const CAT_C = {arama:B.green,toplantı:B.navy,aksiyon:B.amber,acil:B.red,takip:B.muted,bekle:B.purple,mesaj:"#2b4170",fatura:B.gold,ziyaret:B.green,kişisel:B.dim};
const GIDER_CATS = ["Yakıt","Gıda","Restoran/Kafe","Ofis Malzeme","Ulaşım","Konaklama","Telefon/İnternet","Kırtasiye","Danışmanlık Gideri","Reklam/Tanıtım","Diğer"];
const GIDER_KDV = {"Yakıt":20,"Gıda":1,"Restoran/Kafe":10,"Ofis Malzeme":20,"Ulaşım":10,"Konaklama":10,"Telefon/İnternet":20,"Kırtasiye":20,"Danışmanlık Gideri":20,"Reklam/Tanıtım":20,"Diğer":20};
const SYM = {EUR:"€",USD:"$",TRY:"₺"};
const TODAY = new Date().toISOString().split("T")[0];
const MUK = {vkn:"7310813751",ad:"ERSİN POLAT",vd:"NİLÜFER",nace:"702202"};
const SGK_AYLIK = Math.round(22104*0.325); // 2025 Bağ-Kur 4/b şahıs
// 1 asgari ücretli çalışan işveren maliyeti (Aralık 2024'ten itibaren)
const ISCI_BRUT_2025 = 26005.5; // brüt asgari ücret 2025
const ISCI_SGK_ISVEREN = Math.round(ISCI_BRUT_2025 * 0.205); // %20.5 SGK işveren payı
const ISCI_ISSIZLIK = Math.round(ISCI_BRUT_2025 * 0.02);    // %2 işsizlik işveren
const ISCI_TOPLAM_AYLIK = Math.round(ISCI_BRUT_2025 + ISCI_SGK_ISVEREN + ISCI_ISSIZLIK); // ~31,856 TL
const ISCI_BASLANGIC = "2024-12"; // Aralık 2024'ten itibaren

// 2026 Gelir Vergisi Dilimleri
const gelirVergisi = m => {
  if(m<=0) return 0;
  // 2026 tarifesi
  const d=[[190000,.15],[400000,.20],[1500000,.27],[5300000,.35],[Infinity,.40]];
  let v=0,p=0;
  for(const [l,r] of d){ v+=(Math.min(m,l)-p)*r; p=l; if(m<=l) break; }
  return v;
};
// Damga Vergisi: Bordro × %0.759 (2025)
const damgaVergisi = brut => Math.round(brut * 0.00759);
// Muhtasar (ücret stopajı): %15 ilk dilim
const muhtasarVergisi = net => Math.round(net * 0.15);
const fmtD = d => d ? new Date(d).toLocaleDateString("tr-TR") : "—";
const daysSince = d => d ? Math.floor((new Date(TODAY)-new Date(d))/86400000) : 999;
const getYil = d => d?.slice(0,4);
const getAy  = d => d?.slice(0,7);
const kdvRate = tarih => tarih >= "2023-07-10" ? 20 : 18;

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
  {id:"p9",yetkili:"Ahu Acar",firma:"Özkan Hidrolik (DDX)",ref:"EP",sehir:"İzmir",durum:"tamamlandı",service:"DDX",amount:60000,currency:"TRY",notes:"17 mart patron toplantısı.",lastContact:"2026-01-22",assignee:"Ergin Polat"},
  {id:"p10",yetkili:"Ahu Acar",firma:"Özkan Hidrolik (Kapasite)",ref:"EP",sehir:"İzmir",durum:"tamamlandı",service:"Kapasite",amount:10000,currency:"TRY",notes:"",lastContact:"2026-01-22",assignee:"Ersin Polat"},
  {id:"p11",yetkili:"Enes Bey",firma:"Capri Soğutma",ref:"EP",sehir:"Bursa",durum:"tamamlandı",service:"Kapasite",amount:45000,currency:"TRY",notes:"",lastContact:"2026-03-04",assignee:"Ergin Polat"},
  {id:"p12",yetkili:"Erdinç Bey",firma:"Evorino AŞ",ref:"Kader Bey",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"",lastContact:"2025-02-22",assignee:"Ersin Polat"},
  {id:"p13",yetkili:"Eliz Hanım",firma:"Dervolit Plastik",ref:"EP",sehir:"İstanbul",durum:"tamamlandı",service:"Kapasite",amount:10000,currency:"TRY",notes:"",lastContact:"2025-06-30",assignee:"Ergin Polat"},
  {id:"p14",yetkili:"ERAY / DENİZ BEY",firma:"BURTEK",ref:"Hitsoft",sehir:"BURSA",durum:"tamamlandı",service:"Kapasite",amount:280000,currency:"TRY",notes:"Kredinin %2'si.",lastContact:"2025-01-15",assignee:"Ergin Polat"},
  {id:"p15",yetkili:"DAVİT / EFRAYİM",firma:"SINKOTECH",ref:"Hitsoft",sehir:"İstanbul",durum:"tamamlandı",service:"Kapasite",amount:300000,currency:"TRY",notes:"Kredinin %2'si.",lastContact:"2025-01-20",assignee:"Ergin Polat"},
  {id:"p16",yetkili:"VİLDAN HANIM",firma:"OBADAN CATERING",ref:"ANC-NUR HANIM",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"YODA",lastContact:"2025-03-01",assignee:"Ersin Polat"},
  {id:"p17",yetkili:"ESRA OCAKÇI",firma:"TÜRK TİCARET.NET",ref:"ANC-NUR HANIM",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:10000,currency:"TRY",notes:"YODA",lastContact:"2025-03-05",assignee:"Ersin Polat"},
  {id:"p18",yetkili:"BÜLEND ATALAR",firma:"Gecem Aydınlatma",ref:"ARMUT",sehir:"BURSA",durum:"tamamlandı",service:"YODA",amount:5000,currency:"TRY",notes:"YODA",lastContact:"2025-04-01",assignee:"Ersin Polat"},
  {id:"p19",yetkili:"Vahap Bey",firma:"ACAR VİDA",ref:"Hitsoft",sehir:"İstanbul",durum:"tamamlandı",service:"Kapasite",amount:0,currency:"TRY",notes:"Kredinin %2,5'i.",lastContact:"2025-01-01",assignee:"Ergin Polat"},
  {id:"p20",yetkili:"MURAT BEY",firma:"URZEMA HOLDİNG",ref:"Hitsoft",sehir:"İstanbul",durum:"tamamlandı",service:"Kapasite",amount:0,currency:"TRY",notes:"Kredinin %2,5'i.",lastContact:"2025-01-01",assignee:"Ergin Polat"},
  {id:"p21",yetkili:"ÖZGÜN GÜN",firma:"KUZUOĞLU su ürünleri",ref:"Hitsoft",sehir:"Rize",durum:"tamamlandı",service:"Kapasite",amount:0,currency:"TRY",notes:"",lastContact:"2025-01-01",assignee:"Ergin Polat"},
  {id:"p22",yetkili:"KURTULUŞ & ERTAN",firma:"Elsoteknik Soğutma",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p23",yetkili:"KURTULUŞ & ERTAN",firma:"Pasifik Raf Teşhir",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p24",yetkili:"KURTULUŞ & ERTAN",firma:"Logo Market",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p25",yetkili:"KURTULUŞ & ERTAN",firma:"Eco Cold Soğutma",ref:"EP",sehir:"Manisa",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p26",yetkili:"KURTULUŞ & ERTAN",firma:"Cremma Cafe",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p27",yetkili:"Filiz Hanım",firma:"ORELA CERT",ref:"DDX GRUP",sehir:"Kocaeli",durum:"bekliyoruz",service:"DDX",amount:65000,currency:"TRY",notes:"",lastContact:"2025-08-01",assignee:"Ergin Polat"},
  {id:"p28",yetkili:"PKF Consulting",firma:"PKF Consulting",ref:"İLHAN AVCI",sehir:"Bursa",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:1500,currency:"EUR",notes:"",lastContact:"2025-03-01",assignee:"Ergin Polat"},
  {id:"p29",yetkili:"Çiler ÖZGÜR AKGÜL",firma:"TOYOTA ALJ",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"DDX",amount:800,currency:"EUR",notes:"31.01 dönmedi.",lastContact:"2026-01-31",assignee:"Ergin Polat"},
  {id:"p30",yetkili:"PEKSAN",firma:"PEKSAN KAPI",ref:"Hitsoft",sehir:"Isparta",durum:"bekliyoruz",service:"Yalın Dönüşüm",amount:2000,currency:"EUR",notes:"",lastContact:"2026-01-22",assignee:"Ergin Polat"},
  {id:"p31",yetkili:"AYTAV",firma:"AYTAV TAVUKÇULUK",ref:"Hitsoft",sehir:"İstanbul",durum:"bekliyoruz",service:"DDX",amount:0,currency:"EUR",notes:"",lastContact:"2025-09-01",assignee:"Ersin Polat"},
  {id:"p32",yetkili:"Mustafa bey",firma:"Hacıbaba Lokumları",ref:"Hitsoft",sehir:"İstanbul",durum:"bekliyoruz",service:"DDX",amount:0,currency:"EUR",notes:"",lastContact:"2025-10-01",assignee:"Ersin Polat"},
  {id:"p33",yetkili:"ÜNSAL BEY",firma:"PİRSU DONANIM",ref:"EROPA",sehir:"İstanbul",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:0,currency:"EUR",notes:"",lastContact:"2025-05-02",assignee:"Ergin Polat"},
  {id:"p34",yetkili:"Mehmet Bey",firma:"ANTEP Yazılım",ref:"EP",sehir:"Antep",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"1-2 ay.",lastContact:"2026-02-08",assignee:"Ergin Polat"},
  {id:"p35",yetkili:"Selda Hanım",firma:"HAZ METAL SANAYİ",ref:"Eropa",sehir:"Hatay",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"Banka sorunu.",lastContact:"2026-03-13",assignee:"Ergin Polat"},
  {id:"p36",yetkili:"Ümit bey",firma:"Kendi Talebi",ref:"EP",sehir:"Bursa",durum:"ertelendi",service:"DDX",amount:40000,currency:"EUR",notes:"2025'e ertelendi.",lastContact:"2026-02-12",assignee:"Ergin Polat"},
  {id:"p37",yetkili:"Murat Korkut",firma:"B-TEK",ref:"EP",sehir:"Bursa",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:2000,currency:"EUR",notes:"",lastContact:"2026-01-13",assignee:"Ersin Polat"},
  {id:"p38",yetkili:"KURTULUŞ & ERTAN",firma:"Nokta Dizayn",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p39",yetkili:"KURTULUŞ & ERTAN",firma:"ND Group Soğutma",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Kapasite",amount:16667,currency:"TRY",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p40",yetkili:"Veysel Arif Bey",firma:"PROAK Kartepe",ref:"EP",sehir:"Kocaeli",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"Zoom yaptık.",lastContact:"2026-02-03",assignee:"Ergin Polat"},
  {id:"p41",yetkili:"Murat PEKER",firma:"BAMEN KAYSERİ",ref:"EROPA",sehir:"Kayseri",durum:"bekliyoruz",service:"Kapasite",amount:0,currency:"EUR",notes:"",lastContact:"2025-06-17",assignee:"Ergin Polat"},
  {id:"p42",yetkili:"Şeniz Hanım",firma:"PROFSAN BORU ÇELİK",ref:"Murat Korkut",sehir:"Zonguldak",durum:"bekliyoruz",service:"YODA",amount:5000,currency:"EUR",notes:"",lastContact:"2025-10-01",assignee:"Ergin Polat"},
  {id:"p43",yetkili:"Eylem Hanım",firma:"Flovmac",ref:"Eropa",sehir:"İzmir",durum:"bekliyoruz",service:"Yeşil Dönüşüm",amount:2250,currency:"EUR",notes:"",lastContact:"2026-03-19",assignee:"Ergin Polat"},
  {id:"p44",yetkili:"Fatih Bey",firma:"Enfal",ref:"BİRKAN BEY",sehir:"Bursa",durum:"bekliyoruz",service:"DDX",amount:2250,currency:"EUR",notes:"",lastContact:"2026-01-28",assignee:"Ergin Polat"},
  {id:"p45",yetkili:"ATAKAN EZİK",firma:"Deg elastomer",ref:"ARMUT",sehir:"BURSA",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:33600,currency:"EUR",notes:"ERP teklifi.",lastContact:"2025-06-11",assignee:"Ersin Polat"},
  {id:"p46",yetkili:"AKIN BEY",firma:"VENTURO TEKSTİL",ref:"THEN EASE",sehir:"BURSA",durum:"bekliyoruz",service:"Yalın Dönüşüm",amount:0,currency:"EUR",notes:"",lastContact:"2025-08-01",assignee:"Ersin Polat"},
  {id:"p47",yetkili:"Muhammed bey",firma:"AYDIN KURUYEMİŞ",ref:"Hitsoft",sehir:"İstanbul",durum:"bekliyoruz",service:"DDX",amount:0,currency:"EUR",notes:"",lastContact:"2026-01-28",assignee:"Ersin Polat"},
  {id:"p48",yetkili:"Akif UZUN",firma:"Cyber4 Intelligence",ref:"ONLINE",sehir:"Zonguldak",durum:"bekliyoruz",service:"Dijital Dönüşüm",amount:65000,currency:"TRY",notes:"",lastContact:"2026-03-19",assignee:"Ergin Polat"},
  {id:"p49",yetkili:"Süleyman Olduk",firma:"SÜLEYMAN OLDUK VİP",ref:"BYB ETİKET",sehir:"Bursa-İst",durum:"kaybedildi",service:"Kapasite",amount:2250,currency:"EUR",notes:"",lastContact:"2026-02-10",assignee:"Ergin Polat"},
  {id:"p50",yetkili:"Canan ÖZTÜRE",firma:"PLZ SEAT BELT",ref:"EP",sehir:"Bursa",durum:"bekliyoruz",service:"DDX",amount:2000,currency:"EUR",notes:"",lastContact:"2025-03-01",assignee:"Ergin Polat"},
  {id:"p51",yetkili:"Cemil Bey",firma:"Üstünel Kimya",ref:"Evant",sehir:"Antep",durum:"şartlı",service:"Dijital Dönüşüm",amount:2750,currency:"EUR",notes:"SIRI-ŞART",lastContact:"2025-05-01",assignee:"Ergin Polat"},
  {id:"p52",yetkili:"AYDIN BEY",firma:"ÇİÇEK SALAMURA",ref:"EP-MÜSİAD",sehir:"İzmir",durum:"bekliyoruz",service:"DDX",amount:2040,currency:"EUR",notes:"",lastContact:"2025-06-01",assignee:"Ergin Polat"},
  {id:"p53",yetkili:"Uğur TUNÇ",firma:"TUNÇ TEKNOLOJİ",ref:"EP",sehir:"Bursa",durum:"bekliyoruz",service:"DDX",amount:1800,currency:"EUR",notes:"",lastContact:"2025-07-01",assignee:"Ergin Polat"},
  {id:"p54",yetkili:"Eliz Hanım",firma:"Dervolit (Hibe)",ref:"EP",sehir:"İstanbul",durum:"bekliyoruz",service:"Yeşil Dönüşüm",amount:0,currency:"EUR",notes:"",lastContact:"2025-01-02",assignee:"Ersin Polat"},
  {id:"p55",yetkili:"Zeynep Hanım",firma:"Birol Makine",ref:"EP",sehir:"Hayrabolu",durum:"bekliyoruz",service:"YODA",amount:0,currency:"EUR",notes:"",lastContact:"2025-05-01",assignee:"Ersin Polat"},
  {id:"p56",yetkili:"HABİB Bey",firma:"Roger Group",ref:"EP",sehir:"Denizli",durum:"kaybedildi",service:"DDX",amount:0,currency:"EUR",notes:"22.01 ilgilenmiyoruz.",lastContact:"2026-01-22",assignee:"Ersin Polat"},
  {id:"p57",yetkili:"Cem Bey",firma:"MATEKA",ref:"EP",sehir:"Çorlu",durum:"bekliyoruz",service:"Yalın Dönüşüm",amount:0,currency:"EUR",notes:"",lastContact:"2025-06-01",assignee:"Ersin Polat"},
  {id:"p58",yetkili:"Tülay / Burak",firma:"ATEŞSÖNMEZ KİMYA",ref:"Eropa",sehir:"Antep",durum:"durdu",service:"Yeşil Dönüşüm",amount:2250,currency:"EUR",notes:"Hibe olmadığı için durdu.",lastContact:"2025-04-01",assignee:"Ergin Polat"},
  {id:"p59",yetkili:"Yeliz Hnm",firma:"BORA ÇELİK",ref:"Hitsoft",sehir:"Eskişehir",durum:"kaybedildi",service:"DDX",amount:2000,currency:"EUR",notes:"Başka danışmanla devam.",lastContact:"2025-05-01",assignee:"Ergin Polat"},
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
  {id:"k12",text:"Sınav tarihi ve çalışma planı",ref:"",category:"kişisel",assignee:"Ergin Polat",done:false},
  {id:"k13",text:"Uğur Bey - Biteg/Ulutek 15 Marta attı",ref:"",category:"takip",assignee:"Ergin Polat",done:false},
  {id:"k14",text:"İKA danışman havuzu - Yavuz Soyisimli mail",ref:"",category:"takip",assignee:"Ersin Polat",done:false},
  {id:"k15",text:"DDX BARAN takip",ref:"",category:"takip",assignee:"Ergin Polat",done:false},
  {id:"k16",text:"MİTHRAMIND MAİLLER gönder/takip",ref:"",category:"aksiyon",assignee:"Ergin Polat",done:false},
  {id:"k17",text:"YODA FATURALAR - OBADAN Nur Hanım TÜRK TİCARET",ref:"",category:"fatura",assignee:"Ersin Polat",done:false},
  {id:"k18",text:"SinkoTech - Efrahim/David ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k19",text:"HAZ METAL HATAY DDX - noterdeymiş",ref:"",category:"bekle",assignee:"Ergin Polat",done:false},
  {id:"k20",text:"DLG Toplantı saati belirle",ref:"",category:"toplantı",assignee:"Ergin Polat",done:false},
  {id:"k21",text:"Vedata yaz Kurtuluşla ne etti",ref:"",category:"mesaj",assignee:"Ergin Polat",done:false},
  {id:"k22",text:"Cezayir - Ev için ara",ref:"",category:"kişisel",assignee:"Ergin Polat",done:false},
  {id:"k23",text:"GÜLER HANIM ARA - Hayat Kimya Hakan için",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k24",text:"Ramazan Teke Yeğeni İlk İş - Faruk takip",ref:"",category:"takip",assignee:"Ergin Polat",done:false},
  {id:"k25",text:"LinkedIn - 2 kişi birlikte çalışmak istiyor",ref:"",category:"aksiyon",assignee:"Ersin Polat",done:false},
  {id:"k26",text:"URFA EDESSA takip",ref:"",category:"takip",assignee:"Ersin Polat",done:false},
  {id:"k27",text:"ŞAHİNKUL ZİYARET",ref:"",category:"ziyaret",assignee:"Ergin Polat",done:false},
  {id:"k28",text:"DENGE HAVACILIK Murat bey - taşınma sonrası ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k29",text:"Murat bey CEO MESAJ DÖNDÜ - sonraki adım",ref:"",category:"aksiyon",assignee:"Ergin Polat",done:false},
  {id:"k30",text:"Cemal Otomasyon ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k31",text:"Özkan Hidrolik - Yerli malı belgesi 1831",ref:"",category:"aksiyon",assignee:"Ersin Polat",done:false},
  {id:"k32",text:"Abdullah kirve firmalar ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k33",text:"Kürşat Mali müşavir kirvesi Kayseri ara",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k34",text:"Website güncelle/yap",ref:"",category:"aksiyon",assignee:"Ersin Polat",done:false},
  {id:"k35",text:"Maraş ajans ECE DÖNER HANIM bekliyor",ref:"",category:"bekle",assignee:"Ergin Polat",done:false},
  {id:"k36",text:"BİTEG FATİH BEY - YALIN ERP SUNA VE EMİNE",ref:"",category:"toplantı",assignee:"Ergin Polat",done:false},
  {id:"k37",text:"KOSGEB Bursa (0312) 595 25 86 Yalçın Gencoğlan",ref:"",category:"arama",assignee:"Ersin Polat",done:false},
  {id:"k38",text:"444 8 290 DOKA - Hicran Hanım danışman havuzu",ref:"",category:"arama",assignee:"Ergin Polat",done:false},
  {id:"k39",text:"Kahta Belediyesi başvuru - Yusuf takip",ref:"",category:"takip",assignee:"Ersin Polat",done:false},
];
const INVOICES0 = [
  {id:"f1",firma:"Ezel Kozmetik",tarih:"2024-06-01",tutarKdvHaric:55000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f2",firma:"VADEN",tarih:"2024-07-01",tutarKdvHaric:37410,currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:""},
  {id:"f3",firma:"Tünelmak",tarih:"2024-12-25",tutarKdvHaric:2250,currency:"EUR",kdvOrani:20,service:"DDX",faturaNotu:""},
  {id:"f4",firma:"AirStar Hava Süspansiyon",tarih:"2024-08-01",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f5",firma:"Minar Mobilya",tarih:"2024-09-01",tutarKdvHaric:1224,currency:"EUR",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f6",firma:"Resco ltd.",tarih:"2024-09-15",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f7",firma:"LD Otomotiv Pres Metal",tarih:"2024-09-20",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f8",firma:"ATOM Teknik",tarih:"2024-10-01",tutarKdvHaric:5000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f9",firma:"Özkan Hidrolik (DDX)",tarih:"2026-01-22",tutarKdvHaric:60000,currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:""},
  {id:"f10",firma:"Özkan Hidrolik (Kapasite)",tarih:"2026-01-22",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:""},
  {id:"f11",firma:"Capri Soğutma",tarih:"2026-03-04",tutarKdvHaric:45000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:""},
  {id:"f12",firma:"Evorino AŞ",tarih:"2025-02-22",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f13",firma:"Dervolit Plastik",tarih:"2025-06-30",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:""},
  {id:"f14",firma:"BURTEK",tarih:"2025-01-15",tutarKdvHaric:280000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"Toplam kredinin %2'si"},
  {id:"f15",firma:"SINKOTECH",tarih:"2025-01-20",tutarKdvHaric:300000,currency:"TRY",kdvOrani:20,service:"Kapasite",faturaNotu:"Toplam kredinin %2'si"},
  {id:"f16",firma:"OBADAN CATERING",tarih:"2025-03-01",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f17",firma:"TÜRK TİCARET.NET",tarih:"2025-03-05",tutarKdvHaric:10000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
  {id:"f18",firma:"Gecem Aydınlatma",tarih:"2025-04-01",tutarKdvHaric:5000,currency:"TRY",kdvOrani:20,service:"YODA",faturaNotu:""},
];

// ─── STORAGE — Supabase önce, localStorage fallback ──────────────────────────
const ls = {
  get: k => { try { const v = typeof window!=="undefined" ? localStorage.getItem(k) : null; return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k,v) => { try { if(typeof window!=="undefined") localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// Supabase'den tüm veriyi çek — her tablo tek satır (id="main")
async function loadFromSupabase() {
  try {
    const [p, t, inv, exp, a] = await Promise.all([
      supa.get("proposals"), supa.get("tasks"),
      supa.get("invoices"), supa.get("expenses"), supa.get("assignees")
    ]);
    const parse = (rows, key) => { const r = rows?.find(x=>x.id===key); return r?.data || null; };
    return {
      proposals: parse(p, "main"),
      tasks:     parse(t, "main"),
      invoices:  parse(inv, "main"),
      expenses:  parse(exp, "main"),
      assignees: parse(a, "main"),
    };
  } catch { return {}; }
}

async function saveToSupabase(table, data) {
  await supa.upsert(table, "main", data);
}
const dlCSV = (rows, fn) => {
  const k = Object.keys(rows[0]);
  const csv = [k.join(";"), ...rows.map(r=>k.map(x=>`"${String(r[x]||"").replace(/"/g,'""')}"`).join(";"))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}));
  a.download = fn; a.click();
};

// ─── ATOM UI COMPONENTS (outside App — prevents focus loss on re-render) ──────
const INP_S = {background:"#fff",border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.text,fontSize:13,fontFamily:"inherit",outline:"none"};
const SEL_S = {background:"#fff",border:`1px solid ${B.border}`,borderRadius:8,padding:"8px 12px",color:B.text,fontSize:13,fontFamily:"inherit",outline:"none"};
const CARD_S = {background:B.card,border:`1px solid ${B.border}`,borderRadius:14,padding:18,boxShadow:"0 1px 4px #1a274406"};

const Card  = ({children,style})=><div style={{...CARD_S,...style}}>{children}</div>;
const Lbl   = ({c})=><div style={{fontSize:10,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{c}</div>;
const Btn   = ({children,color=B.navy,sm,outline,style,...p})=><button style={{background:outline?"transparent":color,color:outline?color:"#fff",border:outline?`1.5px solid ${color}`:"none",borderRadius:8,padding:sm?"5px 12px":"8px 18px",fontSize:sm?11:13,fontFamily:"inherit",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",...style}} {...p}>{children}</button>;
const Chip  = ({label,color,sm})=><span style={{background:color+"18",color,border:`1px solid ${color}30`,borderRadius:20,padding:sm?"1px 7px":"3px 10px",fontSize:sm?10:11,fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}}>{label}</span>;
const SvcBadge   = ({svc})=>{ const c=SVC_C[svc]||SVC_C["Diğer"]; return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.dot}30`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,display:"inline-block",whiteSpace:"nowrap"}}>{svc}</span>; };
const DurumBadge = ({d})=>{ const c=DURUM_CFG[d]||DURUM_CFG.bekliyoruz; return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700,display:"inline-block"}}>{c.label}</span>; };
const KpiCard    = ({l,v,sub,c,pct})=>(
  <div style={{...CARD_S,flex:1,minWidth:110,textAlign:"center",padding:"14px 10px",borderTop:`3px solid ${c}`}}>
    <div style={{fontSize:typeof v==="string"?14:26,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
    {pct!==undefined&&<div style={{fontSize:12,color:c,marginTop:2,fontWeight:700}}>{pct}%</div>}
    <div style={{fontSize:12,color:B.muted,marginTop:5,fontWeight:600}}>{l}</div>
    {sub&&<div style={{fontSize:10,color:B.dim,marginTop:2}}>{sub}</div>}
  </div>
);
const Modal = ({children,onClose})=>(
  <div style={{position:"fixed",inset:0,background:"#1a274460",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <Card style={{width:"90%",maxWidth:480,maxHeight:"92vh",overflow:"auto"}}>{children}</Card>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  // ── ALL STATE (declared first, in stable order)
  const [loaded, setLoaded]         = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginName, setLoginName]   = useState("");
  const [proposals, setProposalsS]  = useState([]);
  const [tasks, setTasksS]          = useState([]);
  const [invoices, setInvoicesS]    = useState([]);
  const [expenses, setExpensesS]    = useState([]);
  const [assignees, setAssigneesS]  = useState(DEFAULT_ASSIGNEES);
  const [rateCache, setRateCache]   = useState({});
  const [fx, setFx]                 = useState({EUR:50.82,USD:44.25,date:null,src:null});
  const [tab, setTab]               = useState("dashboard");
  const [toast, setToast]           = useState(null);
  // Pipeline
  const [selP, setSelP]             = useState(null);
  const [editingProp, setEditingProp] = useState(false);
  const [editPropData, setEditPropData] = useState({});
  const [filter, setFilter]         = useState("all");
  const [svcFilter, setSvcFilter]   = useState("all");
  const [asnFilter, setAsnFilter]   = useState("all");
  const [firmaFilter, setFirmaFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [showDone, setShowDone]     = useState(false);
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [newProp, setNewProp]       = useState({yetkili:"",firma:"",ref:"",sehir:"",durum:"bekliyoruz",service:"DDX",amount:"",currency:"EUR",notes:"",lastContact:TODAY,assignee:"Ergin Polat"});
  const [newNote, setNewNote]       = useState("");
  // Tasks
  const [taskAsnF, setTaskAsnF]     = useState("all");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCat, setNewTaskCat]   = useState("arama");
  const [newTaskAsn, setNewTaskAsn]   = useState("Ergin Polat");
  const [newTaskExtra, setNewTaskExtra] = useState({hedefTarih:"",telefon:"",firma:"",ilgiliKisi:"",konu:""});
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [fadingTasks, setFadingTasks] = useState({});
  const [showAddAsn, setShowAddAsn] = useState(false);
  const [newAsnName, setNewAsnName] = useState("");
  // Mali
  const [maliSub, setMaliSub]       = useState("faturalar");
  const [maliYil, setMaliYil]       = useState(new Date().getFullYear().toString());
  const [addInvOpen, setAddInvOpen] = useState(false);
  const [newInv, setNewInv]         = useState({firma:"",tarih:TODAY,tutarKdvHaric:"",currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:""});
  const [addExpOpen, setAddExpOpen] = useState(false);
  const [newExp, setNewExp]         = useState({tarih:TODAY,aciklama:"",kategori:"Yakıt",tutarKdvDahil:"",kdvOrani:20});
  const [scanningExp, setScanningExp] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [taskModal, setTaskModal] = useState(null);
  const [taskModalNote, setTaskModalNote] = useState("");
  const [scanningInv, setScanningInv] = useState(false);
  const [newDurumLabel, setNewDurumLabel] = useState("");
  const [newHizmetLabel, setNewHizmetLabel] = useState("");
  // Dynamic statuses/services stored in localStorage
  const [customStatuses, setCustomStatusesS] = useState(()=> ls.get("v12:statuses") || null);
  const [customServices, setCustomServicesS] = useState(()=> ls.get("v12:services") || null);
  const setCustomStatuses = u=>{ setCustomStatusesS(u); ls.set("v12:statuses",u); };
  const setCustomServices = u=>{ setCustomServicesS(u); ls.set("v12:services",u); };
  // Active statuses = custom or defaults
  const activeStatuses = customStatuses || Object.keys(DURUM_CFG);
  const activeServices = customServices || SERVICES;
  const fileRef = useRef();
  const taskXlsRef = useRef();
  const invFileRef = useRef();

  // ── DERIVED (colour map for assignees)
  const AC = useMemo(()=>{
    const m={};
    assignees.forEach((a,i)=>{ m[a]=ASN_COLORS[i%ASN_COLORS.length]; });
    return m;
  },[assignees]);
  const isAdmin = ADMIN_USERS.includes(currentUser);

  // ── PERSIST HELPERS
  const setProposals = useCallback(u=>{ setProposalsS(u); ls.set("v11:p",u); saveToSupabase("proposals",u); },[]);
  const setTasks     = useCallback(u=>{ setTasksS(u);     ls.set("v11:t",u); saveToSupabase("tasks",u); },[]);
  const setInvoices  = useCallback(u=>{ setInvoicesS(u);  ls.set("v11:inv",u); saveToSupabase("invoices",u); },[]);
  const setExpenses  = useCallback(u=>{ setExpensesS(u);  ls.set("v11:exp",u); saveToSupabase("expenses",u); },[]);
  const setAssignees = useCallback(u=>{ setAssigneesS(u); ls.set("v11:a",u); saveToSupabase("assignees",u); },[]);
  const toast_       = useCallback(m=>{ setToast(m); setTimeout(()=>setToast(null),3000); },[]);

  // ── INIT
  useEffect(()=>{
    (async()=>{
      // Supabase'den yükle, yoksa localStorage'dan, yoksa default data
      const sb = await loadFromSupabase();
      const p   = sb.proposals || ls.get("v11:p");
      const t   = sb.tasks     || ls.get("v11:t");
      const a   = sb.assignees || ls.get("v11:a");
      const inv = sb.invoices  || ls.get("v11:inv");
      const exp = sb.expenses  || ls.get("v11:exp");
      if(p) setProposalsS(p); else setProposalsS(PROPS0);
      if(t) setTasksS(t);     else setTasksS(TASKS0);
      if(a) setAssigneesS(a);
      if(inv) setInvoicesS(inv); else setInvoicesS(INVOICES0);
      if(exp) setExpensesS(exp);
      const u = ls.get("v11:user");
      if(u) setCurrentUser(u);
      setLoaded(true);
      fetchFX();
    })();
  // eslint-disable-next-line
  },[]);

  // ── FX
  const fetchFX = useCallback(async()=>{
    try {
      const r = await fetch("https://api.frankfurter.app/latest?base=EUR&symbols=TRY,USD");
      const d = await r.json();
      if(!d.rates?.TRY) throw new Error();
      setFx({EUR:d.rates.TRY, USD:d.rates.TRY/d.rates.USD, date:d.date, src:"Frankfurter/TCMB"});
    } catch {
      try {
        const r = await fetch("https://open.er-api.com/v6/latest/EUR");
        const d = await r.json();
        setFx({EUR:d.rates.TRY, USD:d.rates.TRY/d.rates.USD, date:TODAY, src:"ExchangeRate-API"});
      } catch {
        setFx({EUR:50.82, USD:44.25, date:TODAY, src:"⚠️ Manuel — Güncelle'ye bas"});
      }
    }
  },[]);

  // Fetch historical rates for mali tab
  useEffect(()=>{
    if(tab!=="mali") return;
    const pairs = [...new Set(invoices.filter(f=>f.currency!=="TRY").map(f=>`${f.tarih}_${f.currency}`))];
    pairs.forEach(async key=>{
      if(rateCache[key]) return;
      const [date,currency] = key.split("_");
      try {
        const r = await fetch(`https://api.frankfurter.app/${date}?base=${currency}&symbols=TRY`);
        const d = await r.json();
        if(d.rates?.TRY) setRateCache(prev=>({...prev,[key]:d.rates.TRY}));
      } catch {}
    });
  },[tab,invoices]);

  // ── CONVERTERS
  const toTRY = useCallback((amt,cur,date)=>{
    if(!amt||amt===0) return 0;
    if(cur==="TRY") return amt;
    const rate = (date&&rateCache[`${date}_${cur}`]) || fx[cur] || (cur==="EUR"?50.82:44.25);
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
    let a = proposals;
    if(filter!=="all")      a = a.filter(p=>p.durum===filter);
    if(svcFilter!=="all")   a = a.filter(p=>p.service===svcFilter);
    if(asnFilter!=="all")   a = a.filter(p=>p.assignee===asnFilter);
    if(firmaFilter!=="all") a = a.filter(p=>p.firma===firmaFilter);
    if(search) a = a.filter(p=>(p.firma+p.yetkili+p.sehir+p.ref).toLowerCase().includes(search.toLowerCase()));
    return a;
  },[proposals,filter,svcFilter,asnFilter,firmaFilter,search]);

  const maliAllYears = maliYil==="Tümü";
  const invYear  = useMemo(()=>maliAllYears?invoices:invoices.filter(f=>getYil(f.tarih)===maliYil),[invoices,maliYil,maliAllYears]);
  const expYear  = useMemo(()=>maliAllYears?expenses:expenses.filter(e=>getYil(e.tarih)===maliYil),[expenses,maliYil,maliAllYears]);
  const invTRY   = useMemo(()=>invYear.reduce((s,f)=>s+toTRY(f.tutarKdvHaric,f.currency,f.tarih),0),[invYear,toTRY]);
  const invKdv   = useMemo(()=>invYear.reduce((s,f)=>s+toTRY(f.tutarKdvHaric,f.currency,f.tarih)*(f.kdvOrani/100),0),[invYear,toTRY]);
  const expTotal = useMemo(()=>expYear.reduce((s,e)=>s+(e.tutarKdvDahil/(1+e.kdvOrani/100)),0),[expYear]);
  const expKdv   = useMemo(()=>expYear.reduce((s,e)=>{ const n=e.tutarKdvDahil/(1+e.kdvOrani/100); return s+(e.tutarKdvDahil-n); },0),[expYear]);
  const netKdv   = useMemo(()=>Math.max(0,invKdv-expKdv),[invKdv,expKdv]);
  const vergiMat = useMemo(()=>Math.max(0,invTRY-expTotal),[invTRY,expTotal]);
  const tahmGV   = useMemo(()=>gelirVergisi(vergiMat),[vergiMat]);
  const sgkAylar = useMemo(()=>maliAllYears?12:Math.min(12,Math.max(1,Math.ceil((new Date(TODAY)-new Date(`${maliYil}-01-01`))/86400000/30.44))),[maliYil,maliAllYears]);
  const sgkYillik= useMemo(()=>sgkAylar*SGK_AYLIK,[sgkAylar]);
  // 1 çalışan SGK işveren payı (Aralık 2024'ten itibaren = tüm yıl için 12 ay)
  const isciSgkYillik = useMemo(()=>{
    if(maliAllYears) return ISCI_TOPLAM_AYLIK*12;
    const yil=parseInt(maliYil);
    if(yil<2024) return 0;
    if(yil===2024) return ISCI_TOPLAM_AYLIK*1; // sadece Aralık
    return ISCI_TOPLAM_AYLIK*12;
  },[maliYil,maliAllYears]);
  // Muhtasar (ücret stopajı işçiden kesilir ama işverenin beyanı)
  const muhtasarYillik = useMemo(()=>Math.round(ISCI_BRUT_2025*0.15)*sgkAylar,[sgkAylar]);
  // Damga vergisi bordrodan: brüt × %0.759
  const damgaYillik = useMemo(()=>damgaVergisi(ISCI_BRUT_2025)*sgkAylar,[sgkAylar]);
  const toplamYuk= useMemo(()=>tahmGV+netKdv+sgkYillik+isciSgkYillik,[tahmGV,netKdv,sgkYillik,isciSgkYillik]);
  const netKalan = useMemo(()=>Math.max(0,invTRY-toplamYuk),[invTRY,toplamYuk]);

  const aylikChart = useMemo(()=>{
    const months=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    return months.map((m,i)=>{
      const pad=String(i+1).padStart(2,"0");
      const filter_ = maliAllYears ? (f=>getAy(f.tarih)?.slice(5)===pad) : (f=>getAy(f.tarih)===`${maliYil}-${pad}`);
      const gelir = invYear.filter(filter_).reduce((s,f)=>s+toTRY(f.tutarKdvHaric,f.currency,f.tarih),0);
      const gider = expYear.filter(filter_).reduce((s,e)=>s+(e.tutarKdvDahil/(1+e.kdvOrani/100)),0);
      return {name:m,Gelir:Math.round(gelir),Gider:Math.round(gider)};
    });
  },[invYear,expYear,toTRY,maliYil,maliAllYears]);

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
    const updated=[dup,...proposals];
    setProposals(updated);
    setSelP(dup);
    setEditingProp(true);
    setEditPropData(dup);
    toast_("📋 Kopyalandı — hizmet ve detayları güncelle");
  },[proposals,setProposals,toast_]);

  const addNote = useCallback(()=>{
    if(!newNote.trim()||!selP) return;
    const upd=`${TODAY}: ${newNote.trim()}\n${selP.notes||""}`;
    upProp(selP.id,{notes:upd,lastContact:TODAY});
    setNewNote("");
    toast_("✅ Not kaydedildi");
  },[newNote,selP,upProp,toast_]);

  const addProp = useCallback(()=>{
    if(!newProp.firma) return;
    setProposals([{...newProp,id:"p"+Date.now(),amount:parseFloat(newProp.amount)||0},...proposals]);
    setAddPropOpen(false);
    setNewProp({yetkili:"",firma:"",ref:"",sehir:"",durum:"bekliyoruz",service:"DDX",amount:"",currency:"EUR",notes:"",lastContact:TODAY,assignee:"Ergin Polat"});
    toast_("✅ Teklif eklendi");
  },[newProp,proposals,setProposals,toast_]);

  const togTask = useCallback((id)=>{
    const t = tasks.find(x=>x.id===id);
    if(!t) return;
    if(!t.done){
      setFadingTasks(prev=>({...prev,[id]:true}));
      setTimeout(()=>{
        setTasks(tasks.map(x=>x.id===id?{...x,done:true}:x));
        setFadingTasks(prev=>{const n={...prev};delete n[id];return n;});
      },700);
    } else {
      setTasks(tasks.map(x=>x.id===id?{...x,done:false}:x));
    }
  },[tasks,setTasks]);

  const delTask = useCallback(id=>setTasks(tasks.filter(t=>t.id!==id)),[tasks,setTasks]);

  const addTask = useCallback(()=>{
    if(!newTaskText.trim()) return;
    setTasks([{
      text:newTaskText, category:newTaskCat, assignee:newTaskAsn,
      id:"k"+Date.now(), done:false, ref:"",
      ...newTaskExtra,
    },...tasks]);
    setNewTaskText("");
    setNewTaskExtra({hedefTarih:"",telefon:"",firma:"",ilgiliKisi:"",konu:""});
    setShowTaskDetail(false);
    toast_("✅ Görev eklendi");
  },[newTaskText,newTaskCat,newTaskAsn,newTaskExtra,tasks,setTasks,toast_]);

  const addAsn = useCallback(()=>{
    const n=newAsnName.trim();
    if(!n||assignees.includes(n)) return;
    setAssignees([...assignees.filter(a=>a!=="Diğer"),n,"Diğer"]);
    setNewAsnName(""); setShowAddAsn(false);
    toast_(`✅ ${n} eklendi`);
  },[newAsnName,assignees,setAssignees,toast_]);

  const addInvoice = useCallback(()=>{
    if(!newInv.firma||!newInv.tutarKdvHaric) return;
    setInvoices([{...newInv,id:"f"+Date.now(),tutarKdvHaric:parseFloat(newInv.tutarKdvHaric)||0,kdvOrani:kdvRate(newInv.tarih)},...invoices]);
    setAddInvOpen(false);
    setNewInv({firma:"",tarih:TODAY,tutarKdvHaric:"",currency:"TRY",kdvOrani:20,service:"DDX",faturaNotu:""});
    toast_("✅ Fatura eklendi");
  },[newInv,invoices,setInvoices,toast_]);

  const addExpense = useCallback(()=>{
    if(!newExp.aciklama||!newExp.tutarKdvDahil) return;
    setExpenses([{...newExp,id:"e"+Date.now(),tutarKdvDahil:parseFloat(newExp.tutarKdvDahil)||0},...expenses]);
    setAddExpOpen(false);
    setNewExp({tarih:TODAY,aciklama:"",kategori:"Yakıt",tutarKdvDahil:"",kdvOrani:20});
    toast_("✅ Gider eklendi");
  },[newExp,expenses,setExpenses,toast_]);

  // AI receipt scan
  const scanReceipt = useCallback(async(file)=>{
    setScanningExp(true);
    try {
      const b64 = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},
          {type:"text",text:`Bu fiş/faturayı analiz et. Sadece JSON: {"tarih":"YYYY-MM-DD","aciklama":"açıklama","tutarKdvDahil":sayı,"kdvOrani":sayı,"kategori":"Yakıt|Gıda|Restoran/Kafe|Ofis Malzeme|Ulaşım|Konaklama|Telefon/İnternet|Kırtasiye|Reklam/Tanıtım|Diğer"}. Tarih yok: ${TODAY}. KDV yok: 20.`}
        ]}]})
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text||"";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setNewExp(prev=>({...prev,...parsed,tutarKdvDahil:String(parsed.tutarKdvDahil||"")}));
      toast_("🤖 Fiş okundu! Kontrol et ve kaydet.");
    } catch { toast_("⚠️ Fiş okunamadı, manuel gir."); }
    setScanningExp(false);
  },[toast_]);

  // Excel upload for tasks
  const importTasksXLS = useCallback((file)=>{
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      // Parse CSV (semicolon or comma separated)
      const lines = text.split("\n").filter(l=>l.trim());
      if(lines.length<2){ toast_("⚠️ Dosya boş veya hatalı"); return; }
      const sep = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(sep).map(h=>h.replace(/"/g,"").trim().toLowerCase());
      const newTasks = [];
      for(let i=1;i<lines.length;i++){
        const cols = lines[i].split(sep).map(c=>c.replace(/"/g,"").trim());
        if(!cols[0]) continue;
        const getText = (...keys)=>{ for(const k of keys){ const idx=headers.indexOf(k); if(idx>=0&&cols[idx]) return cols[idx]; } return ""; };
        const text_ = getText("görev","gorev","text","task","konu","açıklama","aciklama") || cols[0];
        if(!text_) continue;
        const catRaw = getText("kategori","category","cat","tür","tur") || "takip";
        const cat = CATS.find(c=>catRaw.toLowerCase().includes(c)) || "takip";
        const asnRaw = getText("atanan","assignee","kişi","kisi","sorumlu") || currentUser || "Ergin Polat";
        const asn = assignees.find(a=>a.toLowerCase().includes(asnRaw.toLowerCase().split(" ")[0].toLowerCase())) || (isAdmin?asnRaw:currentUser||"Ergin Polat");
        newTasks.push({id:"k"+Date.now()+i,text:text_,category:cat,assignee:asn,ref:getText("ref","referans","not")  ,done:false});
      }
      if(!newTasks.length){ toast_("⚠️ Görev bulunamadı. Sütun adları: Görev, Kategori, Atanan"); return; }
      setTasks([...newTasks,...tasks]);
      toast_(`✅ ${newTasks.length} görev yüklendi`);
    };
    reader.readAsText(file, "UTF-8");
  },[tasks,setTasks,assignees,currentUser,isAdmin,toast_]);

  const [syncing, setSyncing] = useState(false);

  // Görev tamamlama (modal ile)
  const completeTaskWithNote = useCallback((id, note)=>{
    setTasks(tasks.map(t=>t.id===id?{...t,done:true,completionNote:note||"",completedAt:TODAY}:t));
    setTaskModal(null); setTaskModalNote("");
    toast_("✅ Görev tamamlandı");
  },[tasks,setTasks,toast_]);

  // AI scan gelir faturası
  const scanGelirFatura = useCallback(async(file)=>{
    setScanningInv(true);
    try {
      const b64=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:[
        {type:"image",source:{type:"base64",media_type:file.type||"image/jpeg",data:b64}},
        {type:"text",text:`Bu faturayı analiz et. Sadece JSON döndür: {"firma":"müşteri adı","tarih":"YYYY-MM-DD","tutarKdvHaric":sayı,"currency":"TRY|EUR|USD","kdvOrani":sayı,"faturaNotu":""}. KDV bulamazsan 20 yaz. Tarih bulamazsan: ${TODAY}`}
      ]}]})});
      const data=await resp.json();
      const text=data.content?.[0]?.text||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      setNewInv(prev=>({...prev,...parsed,tutarKdvHaric:String(parsed.tutarKdvHaric||"")}));
      setAddInvOpen(true);
      toast_("🤖 Fatura okundu! Kontrol et ve kaydet.");
    }catch{ toast_("⚠️ Okunamadı, manuel gir."); }
    setScanningInv(false);
  },[toast_]);

  // ── LOADING
  if(!loaded) return <div style={{background:B.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:B.muted,fontFamily:"system-ui"}}>Yükleniyor...</div>;

  // ── LOGIN
  const doLogin = name=>{
    if(!name.trim()) return;
    const n=name.trim();
    setCurrentUser(n);
    setNewTaskAsn(n);
    ls.set("v11:user",n);
  };

  if(!currentUser) return (
    <div style={{background:B.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=DM+Sans:wght@400;700;800&display=swap');*{box-sizing:border-box}button:hover{opacity:.88}`}</style>
      <div style={{background:B.card,borderRadius:20,padding:"40px 44px",boxShadow:"0 8px 40px #1a274420",maxWidth:400,width:"90%",textAlign:"center"}}>
        <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontWeight:700,fontSize:30,color:B.navy,letterSpacing:"0.06em",marginBottom:4}}>SENSEİ</div>
        <div style={{fontSize:11,color:B.gold,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:24}}>Danışmanlık · CRM</div>
        <div style={{fontSize:13,color:B.muted,marginBottom:20}}>Kim olduğunuzu seçin</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {["Ergin Polat","Ersin Polat"].map((name,i)=>(
            <button key={name} onClick={()=>doLogin(name)}
              style={{background:B.navy,color:"#fff",border:"none",borderRadius:12,padding:"14px 20px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,background:i===0?B.gold:B.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0}}>
                {name.split(" ").map(n=>n[0]).join("")}
              </div>
              <span style={{flex:1,textAlign:"left"}}>{name}</span>
              <span style={{fontSize:10,color:"#ffffff50",background:"#ffffff15",borderRadius:6,padding:"2px 8px"}}>Tam Erişim</span>
            </button>
          ))}
        </div>
        <div style={{position:"relative",marginBottom:14}}>
          <div style={{height:1,background:B.border}}/>
          <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:B.card,padding:"0 12px",fontSize:11,color:B.dim}}>ya da</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...INP_S,flex:1,textAlign:"left"}} placeholder="Adınızı yazın..." value={loginName} onChange={e=>setLoginName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin(loginName)}/>
          <Btn onClick={()=>doLogin(loginName)} color={B.gold}>Giriş</Btn>
        </div>
        <div style={{fontSize:11,color:B.dim,marginTop:10}}>Ergin / Ersin dışındaki kullanıcılar sadece kendi adlarına görev ekleyebilir.</div>
      </div>
    </div>
  );

  // ── TABS CONFIG
  const TABS=[
    {id:"dashboard",label:"📊 Dashboard"},
    {id:"pipeline",label:`💼 Pipeline (${pipeline.length})`},
    {id:"tasks",label:`✅ Görevler (${openTasks.length})`},
    {id:"mali",label:"💰 Mali"},
  ];

  // ── RENDER
  return (
    <div style={{background:B.bg,minHeight:"100vh",fontFamily:"'DM Sans',system-ui,sans-serif",color:B.text,fontSize:14}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;700;800&display=swap');*{box-sizing:border-box}select option{background:#fff;color:#1a2744}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#e2e5ee;border-radius:3px}input[type=checkbox]{cursor:pointer}button:hover{opacity:.88;transition:opacity .15s}table th,table td{vertical-align:middle}`}</style>

      {/* HEADER */}
      <div style={{background:"#fff",borderBottom:`1px solid ${B.border}`,padding:"0 20px",display:"flex",alignItems:"center",gap:16,height:56,position:"sticky",top:0,zIndex:50,boxShadow:`0 2px 12px ${B.navy}08`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:34,height:34,background:B.navy,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${B.navy}40`}}>
            <svg width={19} height={19} viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke={B.gold} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontWeight:700,fontSize:20,color:B.navy,letterSpacing:"0.08em",lineHeight:1}}>SENSEİ</div>
            <div style={{fontSize:8,color:B.gold,letterSpacing:"0.12em",textTransform:"uppercase",lineHeight:1,marginTop:1}}>Var Olan "Öz"dedir</div>
          </div>
        </div>
        <div style={{width:1,height:32,background:B.border,flexShrink:0}}/>
        <nav style={{display:"flex",alignItems:"stretch",height:"100%",flex:1}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",color:tab===t.id?B.navy:B.muted,border:"none",borderBottom:tab===t.id?`2.5px solid ${B.gold}`:"2.5px solid transparent",padding:"0 14px",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?800:500,fontFamily:"inherit"}}>{t.label}</button>)}
        </nav>
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {/* User badge */}
          <div style={{background:AC[currentUser]||B.navy,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
            {currentUser.split(" ")[0]}
            <button onClick={()=>{ setCurrentUser(null); ls.set("v11:user",null); }} style={{background:"#ffffff30",border:"none",color:"#fff",borderRadius:8,padding:"1px 6px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>çıkış</button>
          </div>
          {(acilTasks.length>0||stale.length>0)&&<div style={{background:B.redLight,color:B.red,border:`1px solid ${B.red}30`,borderRadius:20,padding:"4px 10px",fontSize:12,fontWeight:700}}>⚡ {acilTasks.length+stale.length}</div>}
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:syncing?B.amber:B.green,fontWeight:700}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:syncing?B.amber:B.green}}/>
            {syncing?"Kaydediliyor...":"Senkron ✓"}
          </div>
          {/* Export dropdown */}
          <div style={{position:"relative"}}>
            <Btn sm outline color={B.navy} onClick={()=>setExportOpen(v=>!v)}>⬇️ Export</Btn>
          <Btn sm outline color={B.muted} onClick={()=>setSettingsOpen(true)}>⚙️</Btn>
            {exportOpen&&(
              <div style={{position:"absolute",top:38,right:0,background:"#fff",border:`1px solid ${B.border}`,borderRadius:12,padding:8,minWidth:230,zIndex:300,boxShadow:`0 8px 32px ${B.navy}18`}}>
                {[
                  {l:"📊 Tüm Teklifler → Excel", fn:()=>{ dlCSV(proposals.map(p=>({Firma:p.firma,Yetkili:p.yetkili,Hizmet:p.service,Durum:p.durum,Atanan:p.assignee,Tutar:p.amount,Kur:p.currency,TRY:Math.round(toTRY(p.amount,p.currency)||0),SonTemas:p.lastContact})),`SENSEi_Teklifler_${TODAY}.csv`); setExportOpen(false); }},
                  {l:"📊 Pipeline → Excel", fn:()=>{ dlCSV(pipeline.map(p=>({Firma:p.firma,Hizmet:p.service,Atanan:p.assignee,Tutar:p.amount,Kur:p.currency,TRY:Math.round(toTRY(p.amount,p.currency)||0),Sessiz:daysSince(p.lastContact)})),`SENSEi_Pipeline_${TODAY}.csv`); setExportOpen(false); }},
                  {l:"📊 Faturalar → Excel", fn:()=>{ dlCSV(invYear.map(f=>({Tarih:f.tarih,Firma:f.firma,Hizmet:f.service,Tutar:f.tutarKdvHaric,Kur:f.currency,KDV:f.kdvOrani,TRY:Math.round(toTRY(f.tutarKdvHaric,f.currency,f.tarih))})),`SENSEi_Faturalar_${maliYil}.csv`); setExportOpen(false); }},
                  {l:"📊 Giderler → Excel", fn:()=>{ dlCSV(expYear.map(e=>({Tarih:e.tarih,Aciklama:e.aciklama,Kategori:e.kategori,KDVdahil:e.tutarKdvDahil,KDV:e.kdvOrani})),`SENSEi_Giderler_${maliYil}.csv`); setExportOpen(false); }},
                ].map(item=>(
                  <button key={item.l} onClick={item.fn}
                    style={{width:"100%",textAlign:"left",background:"transparent",border:"none",borderRadius:8,padding:"8px 12px",fontSize:13,cursor:"pointer",color:B.text,fontFamily:"inherit",display:"block"}}
                    onMouseEnter={e=>e.currentTarget.style.background=B.navyLight}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {item.l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{padding:"16px 20px",maxWidth:1300,margin:"0 auto"}}>

      {/* ══ DASHBOARD ══════════════════════════════════════════════════════════ */}
      {tab==="dashboard"&&(()=>{
        const svcChart=SERVICES.map(s=>({name:s.replace(" Dönüşüm",""),pipeline:pipeline.filter(p=>p.service===s).length,tamamlanan:done_.filter(p=>p.service===s).length})).filter(d=>d.pipeline+d.tamamlanan>0);
        const pieData=[{name:"Tamamlandı",value:done_.length,color:B.green},{name:"Bekliyoruz",value:pipeline.length,color:B.gold},{name:"Kaybedildi",value:lost_.length,color:B.red},{name:"Ertelendi",value:proposals.filter(p=>p.durum==="ertelendi").length,color:B.purple}].filter(d=>d.value>0);
        const teamChart=assignees.map(a=>({name:a.split(" ")[0],"Görev":openTasks.filter(t=>t.assignee===a).length,"Pipeline":pipeline.filter(p=>p.assignee===a).length}));
        return <div>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KpiCard l="Pipeline" v={pipeline.length} sub="aktif firma" c={B.navy}/>
            <KpiCard l="Tamamlandı" v={done_.length} sub="proje" c={B.green}/>
            <KpiCard l="Kazanma" v="" pct={winRate} sub={`${done_.length}/(${done_.length+lost_.length})`} c={winRate>=50?B.green:B.amber}/>
            <KpiCard l="Kazanılan" v={"₺"+fmtN(doneTRY)} sub={`€${fmtN(doneTRY/(fx.EUR||50.82))} · $${fmtN(doneTRY/(fx.USD||44.25))}`} c={B.green}/>
            <KpiCard l="Potansiyel" v={"₺"+fmtN(pipeTRY)} sub={`€${fmtN(pipeTRY/(fx.EUR||50.82))} · $${fmtN(pipeTRY/(fx.USD||44.25))}`} c={B.gold}/>
            <KpiCard l="Sessiz 30g+" v={stale.length} sub="teklif" c={stale.length>0?B.red:B.dim}/>
          </div>
          {/* FX */}
          <Card style={{marginBottom:14}}>
            <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:9,fontWeight:800,color:B.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>TCMB Döviz Kuru{fx.date?` · ${fx.date}`:""}  {fx.src&&<span style={{fontWeight:400,color:B.dim}}>({fx.src})</span>}</div>
                <div style={{display:"flex",gap:20,alignItems:"center"}}>
                  <div><span style={{color:B.dim,fontSize:12}}>1€ = </span><span style={{fontWeight:800,color:B.navy,fontSize:22}}>₺{fx.EUR.toFixed(2)}</span></div>
                  <div><span style={{color:B.dim,fontSize:12}}>1$ = </span><span style={{fontWeight:800,color:B.navy,fontSize:22}}>₺{fx.USD.toFixed(2)}</span></div>
                  <div style={{borderLeft:`1px solid ${B.border}`,paddingLeft:16}}>
                    <div style={{fontSize:11,color:B.muted}}>1₺ = €{(1/fx.EUR).toFixed(4)}</div>
                    <div style={{fontSize:11,color:B.muted}}>1₺ = ${(1/fx.USD).toFixed(4)}</div>
                  </div>
                </div>
              </div>
              <Btn sm outline color={B.muted} style={{marginLeft:"auto"}} onClick={fetchFX}>🔄 Güncelle</Btn>
            </div>
          </Card>
          {/* Alerts */}
          {(acilTasks.length>0||stale.length>0)&&<Card style={{marginBottom:14,borderLeft:`4px solid ${B.red}`}}>
            <div style={{fontSize:12,fontWeight:800,color:B.red,marginBottom:8}}>⚡ Aksiyon Gerekiyor ({acilTasks.length+stale.length})</div>
            {acilTasks.slice(0,2).map(t=><div key={t.id} style={{fontSize:12,color:B.red,padding:"3px 0"}}>🔴 {t.text} <span style={{color:B.muted}}>→ {t.assignee}</span></div>)}
            {stale.slice(0,3).map(p=><div key={p.id} style={{fontSize:12,color:B.amber,padding:"3px 0"}}>⚠️ {p.firma} — {daysSince(p.lastContact)} gün sessiz <span style={{color:B.muted}}>({p.assignee})</span></div>)}
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
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>Ekip Yükü</div>
              <ResponsiveContainer width="100%" height={170}><BarChart data={teamChart} layout="vertical" margin={{top:0,right:10,bottom:0,left:42}}><XAxis type="number" tick={{fontSize:10,fill:B.muted}}/><YAxis dataKey="name" type="category" tick={{fontSize:10,fill:B.navy,fontWeight:700}} width={50}/><Tooltip contentStyle={{fontFamily:"inherit",fontSize:12,borderRadius:8}}/><Bar dataKey="Görev" fill={B.navy} radius={[0,3,3,0]} barSize={9}/><Bar dataKey="Pipeline" fill={B.gold} radius={[0,3,3,0]} barSize={9}/><Legend wrapperStyle={{fontSize:10}}/></BarChart></ResponsiveContainer>
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
                <input style={{...INP_S,flex:1}} placeholder="Ad Soyad" value={newAsnName} onChange={e=>setNewAsnName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAsn()}/>
                <Btn sm onClick={addAsn}>Ekle</Btn>
                <Btn sm outline color={B.muted} onClick={()=>{ setShowAddAsn(false); setNewAsnName(""); }}>İptal</Btn>
              </div>}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {assignees.map(a=>{ const items=openTasks.filter(t=>t.assignee===a); const c=AC[a]||B.navy;
                  return <div key={a} style={{flex:1,minWidth:120,background:B.bg,borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${c}`}}>
                    <div style={{fontWeight:800,color:c,fontSize:12,marginBottom:6}}>{a.split(" ")[0]} <span style={{fontWeight:400,color:B.muted,fontSize:11}}>({items.length})</span></div>
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
                  if(stale.length){ txt+=`⚠️ SESSİZ (30g+)\n`; stale.forEach(p=>txt+=`  • ${p.firma} — ${daysSince(p.lastContact)}g\n`); txt+="\n"; }
                  txt+=`💰 Pipeline: ${pipeline.length} · ₺${fmtN(pipeTRY)} · %${winRate} kazanma`;
                  navigator.clipboard.writeText(txt).then(()=>toast_("📧 Kopyalandı!")).catch(()=>alert(txt));
                }}>📧 Haftalık Özet → Outlook</Btn>
                <Btn color={B.navy} outline onClick={()=>setTab("mali")}>💰 Mali Tabloya Git</Btn>
                <Btn color={B.navy} outline onClick={()=>dlCSV(proposals.map(p=>({Firma:p.firma,Yetkili:p.yetkili,Hizmet:p.service,Durum:p.durum,Atanan:p.assignee,Tutar:p.amount,Kur:p.currency,TRY:Math.round(toTRY(p.amount,p.currency)||0)})),`SENSEi_${TODAY}.csv`)}>📊 Tüm Teklifler → Excel</Btn>
              </div>
            </Card>
          </div>
        </div>;
      })()}

      {/* ══ PIPELINE ═══════════════════════════════════════════════════════════ */}
      {tab==="pipeline"&&<div style={{display:"flex",gap:14,height:"calc(100vh - 130px)"}}>
        {/* List */}
        <div style={{width:selP?360:"100%",flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Card style={{marginBottom:10,padding:12}}>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input style={{...INP_S,flex:1}} placeholder="Firma / yetkili / şehir..." value={search} onChange={e=>setSearch(e.target.value)}/>
              <Btn sm onClick={()=>setAddPropOpen(true)}>+ Yeni Teklif</Btn>
            </div>
            {/* Durum filter */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
              {["all","bekliyoruz","tamamlandı","kaybedildi","durdu","ertelendi","şartlı"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?B.navy:"#fff",color:filter===f?"#fff":B.muted,border:`1px solid ${filter===f?B.navy:B.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
                  {f==="all"?"Tümü":(DURUM_CFG[f]?.label||f).replace(/^[^\s]+ /,"")} ({f==="all"?proposals.length:proposals.filter(p=>p.durum===f).length})
                </button>
              ))}
            </div>
            {/* Hizmet filter */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
              {["all",...SERVICES].map(s=><button key={s} onClick={()=>setSvcFilter(s)} style={{background:svcFilter===s?(SVC_C[s]||{bg:B.navy}).bg||B.navy:"#fff",color:svcFilter===s?(SVC_C[s]||{text:"#fff"}).text||"#fff":B.dim,border:`1px solid ${svcFilter===s?(SVC_C[s]||{dot:B.navy}).dot||B.navy:B.border}30`,borderRadius:20,padding:"2px 9px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s==="all"?"Hepsi":s}</button>)}
            </div>
            {/* Assignee filter */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
              {["all",...assignees].map(a=><button key={a} onClick={()=>setAsnFilter(a)} style={{background:asnFilter===a?(AC[a]||B.navy):"#fff",color:asnFilter===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}40`,borderRadius:20,padding:"2px 10px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a==="all"?"Herkes":a.split(" ")[0]}</button>)}
            </div>
            {/* Firma filter — sadece çoklu teklif firmaları */}
            {(()=>{
              const cnt={}; proposals.forEach(p=>{cnt[p.firma]=(cnt[p.firma]||0)+1;});
              const multi=Object.entries(cnt).filter(([,c])=>c>1).map(([f])=>f).sort();
              if(!multi.length) return null;
              return <div>
                <div style={{fontSize:9,color:B.dim,marginBottom:3,fontWeight:700}}>🏢 Çoklu teklif firmaları</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {firmaFilter!=="all"&&<button onClick={()=>setFirmaFilter("all")} style={{background:B.navyLight,color:B.navy,border:`1px solid ${B.border}`,borderRadius:20,padding:"2px 10px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>× Temizle</button>}
                  {multi.map(f=><button key={f} onClick={()=>setFirmaFilter(firmaFilter===f?"all":f)} style={{background:firmaFilter===f?B.purple:B.purpleLight,color:firmaFilter===f?"#fff":B.purple,border:`1px solid ${B.purple}40`,borderRadius:20,padding:"2px 10px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{f.length>20?f.slice(0,18)+"…":f} ×{cnt[f]}</button>)}
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
                    </div>}
                    <button title="Kopyala" onClick={e=>{e.stopPropagation();dupProp(p);}} style={{background:"transparent",border:`1px solid ${B.border}`,borderRadius:6,padding:"3px 6px",cursor:"pointer",fontSize:11,color:B.muted,fontFamily:"inherit"}}>📋</button>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap",alignItems:"center",cursor:"pointer"}} onClick={()=>setSelP(sel?null:p)}>
                  <DurumBadge d={p.durum}/><SvcBadge svc={p.service}/>
                  <Chip label={p.assignee.split(" ")[0]} color={AC[p.assignee]||B.muted} sm/>
                  {isStale&&<Chip label={`⚠️ ${days}g sessiz`} color={B.red} sm/>}
                </div>
              </div>;
            })}

            {/* Tamamlananlar collapsible */}
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
                        {p.currency!=="TRY"&&tryV>0&&<div style={{fontSize:10,color:B.muted}}>₺{fmtN(tryV)}</div>}
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
                ? <input style={{...INP_S,fontSize:16,fontWeight:800,color:B.navy,width:"100%",marginBottom:6}} value={editPropData.firma||""} onChange={e=>setEditPropData(p=>({...p,firma:e.target.value}))} placeholder="Firma adı"/>
                : <div style={{fontWeight:800,fontSize:18,color:B.navy}}>{selP.firma}</div>
              }
              {editingProp
                ? <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <input style={{...INP_S,flex:1,minWidth:100,fontSize:12}} value={editPropData.yetkili||""} onChange={e=>setEditPropData(p=>({...p,yetkili:e.target.value}))} placeholder="Yetkili"/>
                    <input style={{...INP_S,flex:1,minWidth:90,fontSize:12}} value={editPropData.sehir||""} onChange={e=>setEditPropData(p=>({...p,sehir:e.target.value}))} placeholder="Şehir"/>
                    <input style={{...INP_S,flex:1,minWidth:110,fontSize:12}} value={editPropData.ref||""} onChange={e=>setEditPropData(p=>({...p,ref:e.target.value}))} placeholder="Referans"/>
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

          {/* Amount box */}
          <div style={{background:B.navyLight,borderRadius:10,padding:"12px 16px",marginBottom:14}}>
            <Lbl c="Teklif Tutarı & Son Temas"/>
            {editingProp
              ? <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input type="number" style={{...INP_S,flex:2,minWidth:100}} value={editPropData.amount||""} onChange={e=>setEditPropData(p=>({...p,amount:parseFloat(e.target.value)||0}))} placeholder="Tutar"/>
                  <select style={{...SEL_S,flex:1,minWidth:80}} value={editPropData.currency||"TRY"} onChange={e=>setEditPropData(p=>({...p,currency:e.target.value}))}>{["TRY","EUR","USD"].map(c=><option key={c}>{c}</option>)}</select>
                  <input type="date" style={{...INP_S,flex:2,minWidth:130}} value={editPropData.lastContact||""} onChange={e=>setEditPropData(p=>({...p,lastContact:e.target.value}))}/>
                </div>
              : <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                  {selP.amount>0
                    ? <>
                        <div style={{fontWeight:800,fontSize:22,color:B.navy}}>{SYM[selP.currency]}{fmtN(selP.amount)}</div>
                        {selP.currency!=="TRY"&&<div><div style={{fontSize:10,color:B.muted}}>TRY</div><div style={{fontWeight:700,color:B.green,fontSize:16}}>₺{fmtN(toTRY(selP.amount,selP.currency))}</div></div>}
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
              {Object.entries(DURUM_CFG).map(([d,cfg])=><button key={d} onClick={()=>upProp(selP.id,{durum:d})} style={{background:selP.durum===d?cfg.text:"#fff",color:selP.durum===d?"#fff":cfg.text,border:`1.5px solid ${cfg.border}`,borderRadius:20,padding:"4px 11px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{cfg.label}</button>)}
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
          <div style={{marginBottom:14}}><Lbl c="Not Ekle (Kronolojik)"/>
            <div style={{display:"flex",gap:8}}>
              <input style={{...INP_S,flex:1}} placeholder={`${TODAY}: ne oldu?`} value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()}/>
              <Btn color={B.gold} onClick={addNote}>Kaydet</Btn>
            </div>
          </div>
          <div style={{marginBottom:14}}><Lbl c="Aktivite Geçmişi"/>
            {selP.notes
              ? <div style={{background:B.bg,borderRadius:10,padding:12}}>
                  {selP.notes.split("\n").filter(Boolean).map((line,i,arr)=>{
                    const m=line.match(/^(\d{4}-\d{2}-\d{2}):/);
                    return <div key={i} style={{padding:"7px 0",borderBottom:i<arr.length-1?`1px solid ${B.border}`:"none",lineHeight:1.5}}>
                      {m?<><span style={{fontSize:10,background:B.navy,color:B.gold,borderRadius:4,padding:"1px 7px",fontWeight:800,marginRight:8}}>{m[1]}</span><span style={{fontSize:13}}>{line.slice(12)}</span></>:<span style={{fontSize:13,color:B.muted}}>{line}</span>}
                    </div>;
                  })}
                </div>
              : <div style={{color:B.dim,fontSize:12}}>Henüz not yok.</div>
            }
          </div>
          <Btn sm outline color={B.red} onClick={()=>{ if(confirm("Bu teklifi silmek istiyor musunuz?")){ setProposals(proposals.filter(p=>p.id!==selP.id)); setSelP(null); setEditingProp(false); toast_("🗑️ Teklif silindi"); } }}>🗑️ Teklifi Sil</Btn>
        </Card>}

        {/* Add Proposal Modal */}
        {addPropOpen&&<Modal onClose={()=>setAddPropOpen(false)}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:16}}>+ Yeni Teklif</div>
          {[["Firma Adı *","firma"],["Yetkili","yetkili"],["Referans","ref"],["Şehir","sehir"]].map(([l,k])=>(
            <div key={k} style={{marginBottom:11}}><Lbl c={l}/><input style={{...INP_S,width:"100%"}} value={newProp[k]} onChange={e=>setNewProp(prev=>({...prev,[k]:e.target.value}))}/></div>
          ))}
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:2}}><Lbl c="Tutar"/><input type="number" style={{...INP_S,width:"100%"}} value={newProp.amount} onChange={e=>setNewProp(prev=>({...prev,amount:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="Kur"/><select style={{...SEL_S,width:"100%"}} value={newProp.currency} onChange={e=>setNewProp(prev=>({...prev,currency:e.target.value}))}>{["EUR","USD","TRY"].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          {newProp.amount&&newProp.currency!=="TRY"&&<div style={{background:B.greenLight,borderRadius:8,padding:"7px 12px",marginBottom:11,fontSize:13,color:B.green,fontWeight:700}}>
            ₺{fmtN(parseFloat(newProp.amount||0)*fx[newProp.currency]||0)} · €{fmtN(parseFloat(newProp.amount||0)*(newProp.currency==="USD"?fx.USD/fx.EUR:1))} · ${fmtN(parseFloat(newProp.amount||0)*(newProp.currency==="EUR"?fx.EUR/fx.USD:1))}
          </div>}
          <div style={{marginBottom:11}}><Lbl c="Hizmet"/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {SERVICES.map(s=><button key={s} onClick={()=>setNewProp(prev=>({...prev,service:s}))} style={{background:newProp.service===s?B.navy:"#fff",color:newProp.service===s?"#fff":B.muted,border:`1px solid ${newProp.service===s?B.navy:B.border}`,borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{s}</button>)}
            </div>
          </div>
          <div style={{marginBottom:11}}><Lbl c="Durum"/><select style={{...SEL_S,width:"100%"}} value={newProp.durum} onChange={e=>setNewProp(prev=>({...prev,durum:e.target.value}))}>{Object.keys(DURUM_CFG).map(o=><option key={o}>{o}</option>)}</select></div>
          <div style={{marginBottom:11}}><Lbl c="Atanan"/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {assignees.map(a=><button key={a} onClick={()=>setNewProp(prev=>({...prev,assignee:a}))} style={{background:newProp.assignee===a?(AC[a]||B.navy):"#fff",color:newProp.assignee===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a}</button>)}
            </div>
          </div>
          <div style={{marginBottom:16}}><Lbl c="Not"/><textarea style={{...{...INP_S,width:"100%",height:70,resize:"vertical"}}} value={newProp.notes} onChange={e=>setNewProp(prev=>({...prev,notes:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8}}><Btn onClick={addProp}>Kaydet</Btn><Btn outline color={B.muted} onClick={()=>setAddPropOpen(false)}>İptal</Btn></div>
        </Modal>}
      </div>}

      {/* ══ TASKS ══════════════════════════════════════════════════════════════ */}
      {tab==="tasks"&&<div>
        <Card style={{marginBottom:14,padding:14}}>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{fontWeight:800,color:B.navy,flex:1}}>Görev Yönetimi <span style={{fontSize:11,fontWeight:400,color:B.muted}}>· {currentUser} olarak giriş yaptın</span></div>
            {["all",...assignees].map(a=><button key={a} onClick={()=>setTaskAsnF(a)} style={{background:taskAsnF===a?(AC[a]||B.navy):"#fff",color:taskAsnF===a?"#fff":(AC[a]||B.muted),border:`1.5px solid ${AC[a]||B.border}40`,borderRadius:20,padding:"4px 11px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{a==="all"?"Herkes":a.split(" ")[0]} ({a==="all"?openTasks.length:openTasks.filter(t=>t.assignee===a).length})</button>)}
          </div>
          {/* Add task row */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
            <input
              style={{...INP_S,flex:3,minWidth:200}}
              placeholder="Yeni görev... (Enter ile ekle)"
              value={newTaskText}
              onChange={e=>setNewTaskText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!showTaskDetail) addTask(); }}
            />
            <select style={{...SEL_S,flex:1,minWidth:100}} value={newTaskCat} onChange={e=>setNewTaskCat(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            <select style={{...SEL_S,width:140}} value={newTaskAsn} onChange={e=>setNewTaskAsn(e.target.value)}>
              {(isAdmin?assignees:[currentUser||"Ergin Polat"]).map(a=><option key={a}>{a}</option>)}
            </select>
            <Btn onClick={addTask}>+ Ekle</Btn>
            <Btn sm outline color={showTaskDetail?B.navy:B.muted} onClick={()=>setShowTaskDetail(v=>!v)} title="Detaylı form">⊕ Detay</Btn>
          </div>
          {/* Expanded task detail fields */}
          {showTaskDetail&&<div style={{background:B.navyLight,borderRadius:10,padding:14,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:800,color:B.navy,marginBottom:10}}>📋 Detaylı Görev Bilgileri</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <div style={{flex:2,minWidth:160}}>
                <Lbl c="Konu / Açıklama"/>
                <input style={{...INP_S,width:"100%"}} placeholder="Ne konuşulacak, ne yapılacak..." value={newTaskExtra.konu} onChange={e=>setNewTaskExtra(p=>({...p,konu:e.target.value}))}/>
              </div>
              <div style={{flex:1,minWidth:130}}>
                <Lbl c="Hedef Tarih"/>
                <input type="date" style={{...INP_S,width:"100%"}} value={newTaskExtra.hedefTarih} onChange={e=>setNewTaskExtra(p=>({...p,hedefTarih:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <div style={{flex:1,minWidth:140}}>
                <Lbl c="Firma Adı"/>
                <input style={{...INP_S,width:"100%"}} placeholder="Firma / kurum" value={newTaskExtra.firma} onChange={e=>setNewTaskExtra(p=>({...p,firma:e.target.value}))}/>
              </div>
              <div style={{flex:1,minWidth:140}}>
                <Lbl c="İlgili Kişi"/>
                <input style={{...INP_S,width:"100%"}} placeholder="Görüşülecek kişi" value={newTaskExtra.ilgiliKisi} onChange={e=>setNewTaskExtra(p=>({...p,ilgiliKisi:e.target.value}))}/>
              </div>
              <div style={{flex:1,minWidth:140}}>
                <Lbl c="Telefon / İletişim"/>
                <input style={{...INP_S,width:"100%"}} placeholder="+90 5xx..." value={newTaskExtra.telefon} onChange={e=>setNewTaskExtra(p=>({...p,telefon:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={addTask} color={B.green}>✅ Kaydet</Btn>
              <Btn sm outline color={B.muted} onClick={()=>{ setShowTaskDetail(false); setNewTaskExtra({hedefTarih:"",telefon:"",firma:"",ilgiliKisi:"",konu:""}); }}>İptal</Btn>
            </div>
          </div>}
          {/* Excel upload */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:B.navyLight,borderRadius:8,fontSize:12}}>
            <span>📤 Toplu görev yükle (Excel/CSV):</span>
            <input ref={taskXlsRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ importTasksXLS(e.target.files[0]); e.target.value=""; } }}/>
            <Btn sm outline color={B.navy} onClick={()=>taskXlsRef.current?.click()}>CSV/Excel Seç</Btn>
            <span style={{color:B.muted}}>Sütunlar: <b>Görev</b>, Kategori, Atanan (opsiyonel)</span>
          </div>
        </Card>

        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {CATS.map(cat=>{
            const items = tasks.filter(t=>!t.done&&t.category===cat&&(taskAsnF==="all"||t.assignee===taskAsnF));
            if(!items.length) return null;
            const cc=CAT_C[cat]||B.muted;
            return <Card key={cat} style={{minWidth:220,flex:1,padding:14,borderTop:`3px solid ${cc}`}}>
              <div style={{fontSize:11,fontWeight:800,color:cc,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>{cat} ({items.length})</div>
              {items.map(t=><div key={t.id} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"7px 0",borderBottom:`1px solid ${B.border}`,opacity:fadingTasks[t.id]?0:1,transition:"opacity 0.6s",background:fadingTasks[t.id]?B.greenLight+"50":"transparent"}}>
                <input type="checkbox" checked={false} onChange={()=>{ setTaskModal(t); setTaskModalNote(""); }} style={{marginTop:2,accentColor:cc,flexShrink:0,width:14,height:14,cursor:"pointer"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,lineHeight:1.4,textDecoration:fadingTasks[t.id]?"line-through":"none",fontWeight:600}}>{t.text}</div>
                  {t.konu&&<div style={{fontSize:11,color:B.muted,marginTop:1}}>📌 {t.konu}</div>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3,alignItems:"center"}}>
                    {t.ref&&<span style={{fontSize:10,color:B.dim}}>{t.ref}</span>}
                    {t.firma&&<span style={{fontSize:10,color:B.navy,fontWeight:600}}>🏢 {t.firma}</span>}
                    {t.ilgiliKisi&&<span style={{fontSize:10,color:B.muted}}>👤 {t.ilgiliKisi}</span>}
                    {t.telefon&&<span style={{fontSize:10,color:B.green}}>📞 {t.telefon}</span>}
                    {t.hedefTarih&&<span style={{fontSize:10,color:daysSince(t.hedefTarih)<0?B.red:B.amber,fontWeight:700}}>📅 {fmtD(t.hedefTarih)}</span>}
                    <Chip label={t.assignee.split(" ")[0]} color={AC[t.assignee]||B.muted} sm/>
                  </div>
                </div>
                <button style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:16,flexShrink:0,padding:0,lineHeight:1}} onClick={()=>delTask(t.id)} title="Sil">×</button>
              </div>)}
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
      </div>}

      {/* ══ MALİ ══════════════════════════════════════════════════════════════ */}
      {tab==="mali"&&<div>
        <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontWeight:800,color:B.navy,fontSize:15}}>💰 Mali Tablo</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {availableYears.map(y=><button key={y} onClick={()=>setMaliYil(y)} style={{background:maliYil===y?B.navy:"#fff",color:maliYil===y?"#fff":B.muted,border:`1px solid ${maliYil===y?B.navy:B.border}`,borderRadius:8,padding:"5px 14px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{y}</button>)}
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {["faturalar","giderler","vergi"].map(s=><button key={s} onClick={()=>setMaliSub(s)} style={{background:maliSub===s?B.navy:"#fff",color:maliSub===s?"#fff":B.muted,border:`1px solid ${maliSub===s?B.navy:B.border}`,borderRadius:20,padding:"5px 16px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
              {s==="faturalar"?"📄 Faturalar":s==="giderler"?"🧾 Giderler":"📊 Vergi Özeti"}
            </button>)}
          </div>
        </div>

        {/* Faturalar */}
        {maliSub==="faturalar"&&<div>
          <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"flex-start"}}>
            <KpiCard l="Gelir (KDV hariç)" v={"₺"+fmtN(invTRY)} sub={`€${fmtN(invTRY/(fx.EUR||50.82))} · $${fmtN(invTRY/(fx.USD||44.25))}`} c={B.navy}/>
            <KpiCard l="Tahsil Edilen KDV" v={"₺"+fmtN(invKdv)} sub={`€${fmtN(invKdv/(fx.EUR||50.82))}`} c={B.amber}/>
            <KpiCard l="Toplam (KDV dahil)" v={"₺"+fmtN(invTRY+invKdv)} sub={`${invYear.length} fatura`} c={B.green}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn onClick={()=>setAddInvOpen(true)}>+ Fatura Ekle</Btn>
              <input ref={invFileRef} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ scanGelirFatura(e.target.files[0]); e.target.value=""; } }}/>
              <Btn color={B.gold} outline sm onClick={()=>invFileRef.current?.click()}>{scanningInv?"⏳ Okunuyor...":"📷 Fatura Tara (AI)"}</Btn>
            </div>
          </div>
          <div style={{background:B.navyLight,borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:11,color:B.navy}}>
            💡 EUR/USD faturalar o günkü TCMB kuruyla TRY'ye çevrilir. ✓ = gerçek kur, ~ = güncel kur kullanıldı.
          </div>
          <div style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:12,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
              <thead><tr style={{background:B.navy,color:"#fff"}}>
                {["Tarih","Firma","Hizmet","KDV Hariç","Kur","TRY","EUR","USD","KDV%","KDV","Toplam",""].map((h,i)=><th key={i} style={{padding:"7px 9px",textAlign:"left",fontSize:9,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {invYear.sort((a,b)=>b.tarih.localeCompare(a.tarih)).map((f,i)=>{
                  const rKey=`${f.tarih}_${f.currency}`;
                  const hist=rateCache[rKey];
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

        {/* Giderler */}
        {maliSub==="giderler"&&<div>
          <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap",alignItems:"flex-start"}}>
            <KpiCard l="Gider (KDV hariç)" v={"₺"+fmtN(expTotal)} c={B.red}/>
            <KpiCard l="İndirilecek KDV" v={"₺"+fmtN(expKdv)} c={B.green}/>
            <KpiCard l="Net Ödenecek KDV" v={"₺"+fmtN(netKdv)} sub="Tahsil − İndirim" c={B.amber}/>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn onClick={()=>setAddExpOpen(true)}>+ Gider Ekle</Btn>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]){ setAddExpOpen(true); scanReceipt(e.target.files[0]); e.target.value=""; } }}/>
              <Btn color={B.gold} outline sm onClick={()=>fileRef.current?.click()}>📷 Fiş Tara (AI)</Btn>
            </div>
          </div>
          {expYear.length===0&&<div style={{background:B.goldLight,borderRadius:12,padding:32,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>📷</div>
            <div style={{fontWeight:700,color:B.navy,marginBottom:4}}>Fiş ve faturalarını buraya ekle</div>
            <div style={{fontSize:12,color:B.muted,marginBottom:16}}>KDV otomatik hesaplanır — yakıt %20, gıda %1, restoran %10</div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <Btn color={B.gold} onClick={()=>fileRef.current?.click()}>📷 Fiş Fotoğrafı (AI okur)</Btn>
              <Btn color={B.navy} outline onClick={()=>setAddExpOpen(true)}>+ Manuel Gir</Btn>
            </div>
          </div>}
          {expYear.length>0&&<div style={{background:B.card,border:`1px solid ${B.border}`,borderRadius:12,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:500}}>
              <thead><tr style={{background:B.navy,color:"#fff"}}>
                {["Tarih","Açıklama","Kategori","KDV Dahil","KDV%","İnd. KDV","KDV Hariç",""].map((h,i)=><th key={i} style={{padding:"7px 9px",textAlign:"left",fontSize:9,textTransform:"uppercase",fontWeight:700}}>{h}</th>)}
              </tr></thead>
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
                <td/>
                <td style={{padding:"9px",fontWeight:800,color:B.gold}}>₺{fmtN(expKdv)}</td>
                <td style={{padding:"9px",fontWeight:800}}>₺{fmtN(expTotal)}</td>
                <td/>
              </tr></tfoot>
            </table>
          </div>}
        </div>}

        {/* Vergi Özeti */}
        {maliSub==="vergi"&&<div>
          <div style={{background:B.navyLight,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:12,color:B.navy}}>
            🏛️ <b>{MUK.ad}</b> · VKN: {MUK.vkn} · {MUK.vd} V.D. · Şahıs · Yıllık Beyan · SGK 4/b Bağ-Kur · {maliYil}
          </div>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KpiCard l="Gelir (KDV hariç)" v={"₺"+fmtN(invTRY)} sub={`€${fmtN(invTRY/(fx.EUR||50.82))} · $${fmtN(invTRY/(fx.USD||44.25))}`} c={B.navy}/>
            <KpiCard l="Gider (KDV hariç)" v={"₺"+fmtN(expTotal)} sub="indirilecek" c={B.red}/>
            <KpiCard l="Vergi Matrahı" v={"₺"+fmtN(vergiMat)} sub={`€${fmtN(vergiMat/(fx.EUR||50.82))}`} c={B.navy}/>
            <KpiCard l="Gelir Vergisi" v={"₺"+fmtN(tahmGV)} sub={`€${fmtN(tahmGV/(fx.EUR||50.82))} · $${fmtN(tahmGV/(fx.USD||44.25))}`} c={B.red}/>
            <KpiCard l="Net KDV" v={"₺"+fmtN(netKdv)} sub={`€${fmtN(netKdv/(fx.EUR||50.82))} · $${fmtN(netKdv/(fx.USD||44.25))}`} c={B.amber}/>
            <KpiCard l="SGK Bağ-Kur (4/b)" v={"₺"+fmtN(sgkYillik)} sub={`${sgkAylar} ay × ₺${fmtN(SGK_AYLIK)}`} c={B.purple}/>
            <KpiCard l="İşçi SGK+İşsizlik" v={"₺"+fmtN(isciSgkYillik)} sub={`1 çalışan · ₺${fmtN(ISCI_TOPLAM_AYLIK)}/ay`} c={B.purple}/>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <Card style={{flex:1,minWidth:260,borderTop:`4px solid ${B.red}`}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>💸 Toplam Yük & Net Kalan</div>
              {[["Gelir Vergisi (2026)",tahmGV,B.navy],["Net KDV",netKdv,B.amber],["SGK Bağ-Kur 4/b",sgkYillik,B.purple],["İşçi SGK İşveren Payı",isciSgkYillik,B.purple],["Muhtasar (ücret stopajı)",muhtasarYillik,B.red],["Damga Vergisi (bordro)",damgaYillik,B.muted],["","",""],["TOPLAM YÜK",toplamYuk,B.red],["NET KALAN",netKalan,B.green]].map(([l,v,c],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<7?`1px solid ${B.border}`:"none"}}>
                  <span style={{fontSize:12,fontWeight:[7,8].includes(i)?800:400,color:!l?B.dim:B.text}}>{l||"─────────"}</span>
                  {v&&<div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,fontWeight:700,color:c}}>₺{fmtN(v)}</div>
                    <div style={{fontSize:9,color:B.dim}}>€{fmtN(v/(fx.EUR||50.82))} · ${fmtN(v/(fx.USD||44.25))}</div>
                  </div>}
                </div>
              ))}
              <div style={{marginTop:12,background:B.greenLight,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,color:B.green,fontSize:13}}>Efektif Vergi Oranı</span>
                <span style={{fontSize:26,fontWeight:800,color:invTRY>0&&toplamYuk/invTRY>0.4?B.red:B.green}}>%{invTRY>0?Math.round(toplamYuk/invTRY*100):0}</span>
              </div>
              <div style={{marginTop:10,fontSize:11,color:B.muted}}>SGK: Asgari ücret × %32.5 = ₺{fmtN(SGK_AYLIK)}/ay · KDV: Hizmet %20, Gıda %1, Restoran %10</div>
            </Card>
            <Card style={{flex:1,minWidth:200}}>
              <div style={{fontWeight:800,color:B.navy,marginBottom:14,fontSize:13}}>📈 Aylık Gelir / Gider (₺)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={aylikChart} margin={{top:0,right:0,bottom:16,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={B.border}/>
                  <XAxis dataKey="name" tick={{fontSize:9,fill:B.muted}}/>
                  <YAxis tick={{fontSize:9,fill:B.muted}} width={42} tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:v}/>
                  <Tooltip contentStyle={{fontFamily:"inherit",fontSize:11,borderRadius:8}} formatter={v=>"₺"+fmtN(v)}/>
                  <Bar dataKey="Gelir" fill={B.navy} radius={[3,3,0,0]}/>
                  <Bar dataKey="Gider" fill={B.red} radius={[3,3,0,0]}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <div style={{background:B.amberLight,borderRadius:10,padding:"10px 16px",border:`1px solid ${B.gold}40`,fontSize:12,color:B.amber,marginTop:14}}>
            ⚠️ <b>Tahmini hesaplamadır.</b> Kesin beyan için mali müşavirinize danışın. · 2026 Gelir Vergisi Tarifesi uygulanmaktadır. · 1 asgari ücretli çalışan işveren maliyeti: ₺{fmtN(ISCI_TOPLAM_AYLIK)}/ay (brüt + SGK + işsizlik). Muhtasar ve damga vergisi çalışan maaşı üzerinden hesaplanır.
          </div>
        </div>}

        {/* Fatura Modal */}
        {addInvOpen&&<Modal onClose={()=>setAddInvOpen(false)}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:16}}>📄 Fatura Ekle</div>
          {[["Firma/Müşteri *","firma"],["Fatura Notu","faturaNotu"]].map(([l,k])=>(
            <div key={k} style={{marginBottom:11}}><Lbl c={l}/><input style={{...INP_S,width:"100%"}} value={newInv[k]} onChange={e=>setNewInv(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div style={{marginBottom:11}}><Lbl c="Fatura Tarihi"/><input type="date" style={{...INP_S,width:"100%"}} value={newInv.tarih} onChange={e=>setNewInv(p=>({...p,tarih:e.target.value,kdvOrani:kdvRate(e.target.value)}))}/></div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:2}}><Lbl c="KDV Hariç Tutar *"/><input type="number" style={{...INP_S,width:"100%"}} value={newInv.tutarKdvHaric} onChange={e=>setNewInv(p=>({...p,tutarKdvHaric:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="Para Birimi"/><select style={{...SEL_S,width:"100%"}} value={newInv.currency} onChange={e=>setNewInv(p=>({...p,currency:e.target.value}))}>{["TRY","EUR","USD"].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:1}}><Lbl c="KDV %"/><select style={{...SEL_S,width:"100%"}} value={newInv.kdvOrani} onChange={e=>setNewInv(p=>({...p,kdvOrani:parseInt(e.target.value)}))}>{[0,1,8,10,18,20].map(r=><option key={r}>{r}</option>)}</select></div>
            <div style={{flex:2}}><Lbl c="Hizmet"/><select style={{...SEL_S,width:"100%"}} value={newInv.service} onChange={e=>setNewInv(p=>({...p,service:e.target.value}))}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          {newInv.tutarKdvHaric&&<div style={{background:B.greenLight,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:13,color:B.green,fontWeight:700}}>
            KDV: ₺{fmtN(parseFloat(newInv.tutarKdvHaric||0)*(newInv.currency==="TRY"?1:(fx[newInv.currency]||50.82))*(newInv.kdvOrani/100))}
          </div>}
          <div style={{display:"flex",gap:8}}><Btn onClick={addInvoice}>Kaydet</Btn><Btn outline color={B.muted} onClick={()=>setAddInvOpen(false)}>İptal</Btn></div>
        </Modal>}

        {/* Gider Modal */}
        {addExpOpen&&<Modal onClose={()=>{ setAddExpOpen(false); setNewExp({tarih:TODAY,aciklama:"",kategori:"Yakıt",tutarKdvDahil:"",kdvOrani:20}); }}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:4}}>🧾 Gider Ekle {scanningExp&&<span style={{fontSize:12,color:B.gold}}>🤖 AI okuyor...</span>}</div>
          {scanningExp&&<div style={{background:B.goldLight,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:B.amber,textAlign:"center"}}>🤖 Fiş okunuyor...</div>}
          <div style={{marginBottom:11}}><Lbl c="Tarih"/><input type="date" style={{...INP_S,width:"100%"}} value={newExp.tarih} onChange={e=>setNewExp(p=>({...p,tarih:e.target.value}))}/></div>
          <div style={{marginBottom:11}}><Lbl c="Açıklama *"/><input style={{...INP_S,width:"100%"}} placeholder="Petroil, Migros, BİM..." value={newExp.aciklama} onChange={e=>setNewExp(p=>({...p,aciklama:e.target.value}))}/></div>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:2}}><Lbl c="Tutar (KDV dahil) *"/><input type="number" style={{...INP_S,width:"100%"}} value={newExp.tutarKdvDahil} onChange={e=>setNewExp(p=>({...p,tutarKdvDahil:e.target.value}))}/></div>
            <div style={{flex:1}}><Lbl c="KDV %"/><select style={{...SEL_S,width:"100%"}} value={newExp.kdvOrani} onChange={e=>setNewExp(p=>({...p,kdvOrani:parseInt(e.target.value)}))}>{[0,1,8,10,18,20].map(r=><option key={r}>{r}</option>)}</select></div>
          </div>
          <div style={{marginBottom:11}}><Lbl c="Kategori"/><select style={{...SEL_S,width:"100%"}} value={newExp.kategori} onChange={e=>setNewExp(p=>({...p,kategori:e.target.value,kdvOrani:GIDER_KDV[e.target.value]||20}))}>{GIDER_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
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

      </div>{/* end main container */}

      {/* ── GÖREV TAMAMLAMA MODAL */}
      {taskModal&&<div style={{position:"fixed",inset:0,background:"#1a274460",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={e=>e.target===e.currentTarget&&setTaskModal(null)}>
        <Card style={{width:"90%",maxWidth:420,padding:24}}>
          <div style={{fontWeight:800,fontSize:15,color:B.navy,marginBottom:4}}>✅ Görevi Tamamla</div>
          <div style={{fontSize:13,color:B.muted,marginBottom:14,background:B.navyLight,borderRadius:8,padding:"8px 12px"}}>{taskModal.text}</div>
          {taskModal.firma&&<div style={{fontSize:12,color:B.navy,marginBottom:8}}>🏢 {taskModal.firma} {taskModal.ilgiliKisi?`· 👤 ${taskModal.ilgiliKisi}`:""}</div>}
          <Lbl c="Tamamlama Notu (opsiyonel)"/>
          <input style={{...INP_S,width:"100%",marginBottom:14}} placeholder="Görüşme özeti, sonuç, takip notu..." value={taskModalNote} onChange={e=>setTaskModalNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&completeTaskWithNote(taskModal.id,taskModalNote)} autoFocus/>
          <div style={{display:"flex",gap:8}}>
            <Btn color={B.green} onClick={()=>completeTaskWithNote(taskModal.id,taskModalNote)}>✅ Tamamlandı</Btn>
            <Btn outline color={B.muted} onClick={()=>setTaskModal(null)}>İptal</Btn>
          </div>
        </Card>
      </div>}

      {/* ── AYARLAR MODAL — Durum & Hizmet Yönetimi */}
      {settingsOpen&&<div style={{position:"fixed",inset:0,background:"#1a274460",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={e=>e.target===e.currentTarget&&setSettingsOpen(false)}>
        <Card style={{width:"90%",maxWidth:520,padding:24,maxHeight:"85vh",overflow:"auto"}}>
          <div style={{fontWeight:800,fontSize:16,color:B.navy,marginBottom:20}}>⚙️ Ayarlar — Durum & Hizmet Yönetimi</div>
          
          <div style={{marginBottom:20}}>
            <Lbl c="Teklif Durumları"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {activeStatuses.map(d=>{ const cfg=DURUM_CFG[d]; return (
                <div key={d} style={{display:"flex",alignItems:"center",gap:4,background:cfg?.bg||B.navyLight,borderRadius:20,padding:"3px 10px",border:`1px solid ${cfg?.border||B.border}`}}>
                  <span style={{fontSize:12,fontWeight:700,color:cfg?.text||B.navy}}>{cfg?.label||d}</span>
                  <button onClick={()=>setCustomStatuses(activeStatuses.filter(x=>x!==d))} style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input style={{...INP_S,flex:1}} placeholder="Yeni durum adı (örn: müzakere)" value={newDurumLabel} onChange={e=>setNewDurumLabel(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&newDurumLabel.trim()){ setCustomStatuses([...activeStatuses,newDurumLabel.trim()]); setNewDurumLabel(""); } }}/>
              <Btn sm onClick={()=>{ if(newDurumLabel.trim()){ setCustomStatuses([...activeStatuses,newDurumLabel.trim()]); setNewDurumLabel(""); } }}>+ Ekle</Btn>
              <Btn sm outline color={B.muted} onClick={()=>setCustomStatuses(Object.keys(DURUM_CFG))}>Sıfırla</Btn>
            </div>
          </div>

          <div style={{marginBottom:20}}>
            <Lbl c="Hizmet Türleri"/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {activeServices.map(s=>{ const c=SVC_C[s]||SVC_C["Diğer"]; return (
                <div key={s} style={{display:"flex",alignItems:"center",gap:4,background:c.bg,borderRadius:20,padding:"3px 10px",border:`1px solid ${c.dot}30`}}>
                  <span style={{fontSize:11,fontWeight:700,color:c.text}}>{s}</span>
                  <button onClick={()=>setCustomServices(activeServices.filter(x=>x!==s))} style={{background:"transparent",border:"none",color:B.dim,cursor:"pointer",fontSize:14,lineHeight:1,padding:0}}>×</button>
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input style={{...INP_S,flex:1}} placeholder="Yeni hizmet (örn: ISO Danışmanlık)" value={newHizmetLabel} onChange={e=>setNewHizmetLabel(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&newHizmetLabel.trim()){ setCustomServices([...activeServices,newHizmetLabel.trim()]); setNewHizmetLabel(""); } }}/>
              <Btn sm onClick={()=>{ if(newHizmetLabel.trim()){ setCustomServices([...activeServices,newHizmetLabel.trim()]); setNewHizmetLabel(""); } }}>+ Ekle</Btn>
              <Btn sm outline color={B.muted} onClick={()=>setCustomServices(SERVICES)}>Sıfırla</Btn>
            </div>
          </div>

          <div style={{background:B.navyLight,borderRadius:10,padding:"10px 14px",fontSize:12,color:B.navy,marginBottom:16}}>
            ℹ️ Silinen durumlar mevcut tekliflerde görünmeye devam eder. Yeni eklenen durumlar tüm seçim listelerine eklenir.
          </div>

          <Btn outline color={B.muted} onClick={()=>setSettingsOpen(false)}>Kapat</Btn>
        </Card>
      </div>}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:B.navy,color:"#fff",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 6px 24px #1a274440"}}>{toast}</div>}
    </div>
  );
}
