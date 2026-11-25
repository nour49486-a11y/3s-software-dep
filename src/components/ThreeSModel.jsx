import { useEffect, useState } from "react";
import "./layout.css";
export default function ThreeSModel() {
 const [lang,setLang]=useState(()=>localStorage.getItem("3s_lang")||document.documentElement.lang||"en");
 useEffect(()=>{const script=document.createElement("script");script.src="/hero.js";script.async=true;document.body.appendChild(script);const update=(event)=>{setLang(event.detail);requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));};window.addEventListener("3s-language-change",update);return()=>{window.removeEventListener("3s-language-change",update);script.remove();};},[]);
 return <><div className="bd" id="bd" aria-hidden="true">{lang==="ar"?"المستخدمون":"USERS"}</div><canvas id="cv" aria-hidden="true"/><div className="hint" id="hint">{lang==="ar"?"تحرّك عبر 3S":"Move across the 3S"}</div></>;
}

