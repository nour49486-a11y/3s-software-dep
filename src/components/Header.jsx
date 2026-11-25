import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { clearApiSession, getTokenRoles } from "../api.js";
import "./layout.css";
function BrandMark() { return <svg className="brand-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true"><polygon points="12,18 36,18 20,42" fill="#58C8F0"/><path d="M38 18h44a18 18 0 0 1 0 36H50a18 18 0 0 0 0 36h44" stroke="currentColor" strokeWidth="15" strokeLinecap="square"/></svg>; }
function ThemeIcon({ dark }) { return dark ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>; }
function GlobeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>; }
const labels = { en: { home:"Home",team:"Team",about:"About",admin:"Admin",logout:"Log out",dark:"Dark mode",light:"Light mode",arabic:"العربية",english:"English" }, ar: { home:"الرئيسية",team:"الفريق",about:"عن 3S",admin:"الإدارة",logout:"تسجيل الخروج",dark:"الوضع الداكن",light:"الوضع الفاتح",arabic:"العربية",english:"English" } };
export default function Header() {
 const [theme,setTheme]=useState(()=>localStorage.getItem("3s_theme")||document.documentElement.dataset.theme||"light");
 const [lang,setLang]=useState(()=>localStorage.getItem("3s_lang")||document.documentElement.lang||"en"); const navigate=useNavigate(); const t=labels[lang]||labels.en;
 useEffect(()=>{const root=document.documentElement;root.dataset.theme=theme;root.lang=lang;root.dir=lang==="ar"?"rtl":"ltr";localStorage.setItem("3s_theme",theme);localStorage.setItem("3s_lang",lang);window.dispatchEvent(new CustomEvent("3s-language-change",{detail:lang}));},[theme,lang]);
 const canManage=getTokenRoles().includes("admin");
 const logout=()=>{clearApiSession();navigate("/login",{replace:true});};
 return <header className="site-header" id="nav"><Link className="site-brand" to="/home" aria-label="3S home"><BrandMark/><span>3S<sup>®</sup></span></Link><nav className="site-nav" aria-label="Main navigation"><Link to="/home">{t.home}</Link><Link to="/team">{t.team}</Link><Link to="/about">{t.about}</Link>{canManage&&<Link to="/admin">{t.admin}</Link>}<button className="header-login" type="button" onClick={logout}>{t.logout}</button><button type="button" className="header-pill" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label={theme==="dark"?t.light:t.dark}><ThemeIcon dark={theme==="dark"}/><span>{theme==="dark"?t.light:t.dark}</span></button><button type="button" className="header-pill" onClick={()=>setLang(lang==="ar"?"en":"ar")} aria-label="Change language"><GlobeIcon/><span>{lang==="ar"?t.english:t.arabic}</span></button></nav></header>;
}



