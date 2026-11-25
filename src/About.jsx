import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import "./about.css";

const content = {
  en: {
    eyebrow: "ABOUT THE PROJECT",
    title: "People, thoughtfully managed.",
    intro: "3S People Management brings people records, account access, and administrative oversight together in one clear, approachable workspace.",
    frontendTitle: "The frontend",
    frontend: "The interface is built with React 19 and Vite, with React Router for navigation and Axios for communicating with the API. It provides searchable and sortable people directories, profile forms with photo upload and camera capture, and an administrator dashboard for user roles, activity, and system statistics. The layout supports Arabic and English, light and dark themes, and responsive screens. Role-aware controls keep account and record management tools visible to administrators.",
    backendTitle: "The backend",
    backend: "The People Management backend is built with ASP.NET Core Web API, Entity Framework Core, SQL Server, and ASP.NET Core Identity. It supports creating, viewing, updating, and deleting people’s records, including names, genders, phone numbers, email addresses, birth dates, descriptions, and profile pictures. JWT authentication secures registered accounts, while role-based authorization distinguishes administrators from regular users. Administrators can review accounts and assigned roles, promote users to Admin or assign the regular User role, and view dashboard statistics. The system records successful and failed sign-in attempts with timestamps and IP addresses, and provides a live-stream endpoint for the backend device’s camera. Deployed through IIS, the API can serve frontend installations on other devices.",
    stackTitle: "Technology stack",
    stack: ["React 19", "Vite", "React Router", "Axios", "Tailwind CSS", "ASP.NET Core Web API", "Entity Framework Core", "SQL Server", "ASP.NET Core Identity", "JWT", "IIS"],
  },
  ar: {
    eyebrow: "عن المشروع",
    title: "إدارة الأفراد ببساطة ووضوح.",
    intro: "يجمع مشروع 3S لإدارة الأفراد بيانات الأشخاص وصلاحيات الحسابات وأدوات الإدارة في مساحة عمل واحدة سهلة الاستخدام.",
    frontendTitle: "الواجهة الأمامية",
    frontend: "بُنيت الواجهة باستخدام React 19 وVite، مع React Router للتنقل بين الصفحات وAxios للتواصل مع واجهة API. توفر دليلًا للأشخاص مع البحث والترتيب، ونماذج للملفات الشخصية تدعم رفع الصور والتقاطها بالكاميرا، ولوحة إدارة لمتابعة الأدوار والنشاط وإحصائيات النظام. تدعم الواجهة العربية والإنجليزية، والمظهر الفاتح والداكن، والشاشات المختلفة. وتظهر أدوات إدارة الحسابات والسجلات للمسؤولين وفقًا لصلاحياتهم.",
    backendTitle: "الواجهة الخلفية",
    backend: "بُنيت الواجهة الخلفية باستخدام ASP.NET Core Web API وEntity Framework Core وSQL Server وASP.NET Core Identity. تدعم إنشاء سجلات الأشخاص وعرضها وتعديلها وحذفها، بما في ذلك الاسم والنوع والهاتف والبريد الإلكتروني وتاريخ الميلاد والوصف والصورة الشخصية. تؤمّن JWT تسجيل دخول الحسابات، وتفصل الصلاحيات بين المسؤول والمستخدم العادي. يستطيع المسؤول مراجعة الحسابات وأدوارها، وتعيين دور Admin أو User، ومتابعة إحصائيات لوحة الإدارة. كما يسجل النظام محاولات الدخول الناجحة والفاشلة مع التوقيت وعنوان IP، ويوفر نقطة اتصال للبث المباشر من كاميرا الجهاز الذي يشغّل الواجهة الخلفية. ويتيح النشر عبر IIS للواجهات الموجودة على أجهزة أخرى التواصل مع الـ API.",
    stackTitle: "التقنيات المستخدمة",
    stack: ["React 19", "Vite", "React Router", "Axios", "Tailwind CSS", "ASP.NET Core Web API", "Entity Framework Core", "SQL Server", "ASP.NET Core Identity", "JWT", "IIS"],
  },
};

export default function About() {
  const [lang, setLang] = useState(() => localStorage.getItem("3s_lang") || document.documentElement.lang || "en");
  useEffect(() => {
    const update = (event) => setLang(event.detail);
    window.addEventListener("3s-language-change", update);
    return () => window.removeEventListener("3s-language-change", update);
  }, []);
  const t = content[lang] || content.en;
  return <div className="about-page"><Header/><main className="about-main">
    <header className="about-hero"><p className="about-eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>
    <div className="about-grid"><article className="about-card"><span className="about-index">01</span><h2>{t.frontendTitle}</h2><p>{t.frontend}</p></article><article className="about-card"><span className="about-index">02</span><h2>{t.backendTitle}</h2><p>{t.backend}</p></article></div>
    <section className="about-stack"><h2>{t.stackTitle}</h2><ul>{t.stack.map((item) => <li key={item}>{item}</li>)}</ul></section>
  </main><Footer/></div>;
}
