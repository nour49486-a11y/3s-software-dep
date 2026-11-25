import { Link, useNavigate } from "react-router";
import { clearApiSession } from "../api.js";
import { useEffect, useState } from "react";
import "./layout.css";
export default function Footer() {
 const [lang,setLang]=useState(()=>localStorage.getItem("3s_lang")||document.documentElement.lang||"en"); const navigate=useNavigate();
 useEffect(()=>{const update=(event)=>setLang(event.detail);window.addEventListener("3s-language-change",update);return()=>window.removeEventListener("3s-language-change",update);},[]);
 const logout=()=>{clearApiSession();navigate("/login",{replace:true});};
 const labels=lang==="ar"?["الرئيسية","تسجيل الخروج","عن 3S"]:["Home","Log out","About"];
 return <footer className="site-footer"><Link className="footer-brand" to="/home">3S® People Management</Link><nav aria-label={lang==="ar"?"روابط التذييل":"Footer navigation"}><Link to="/home">{labels[0]}</Link><button type="button" onClick={logout}>{labels[1]}</button><a href="/home#about">{labels[2]}</a></nav><small>© {new Date().getFullYear()} 3S People Management</small></footer>;
}



