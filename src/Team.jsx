import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import "./team.css";

const people = [
  { id: "mohamed", name: "Mohamed Tarek", role: "Full Stack Developer", badge: "Team Leader", initials: "MT" },
  { id: "ahmed", name: "Ahmed Ibrahim", role: "Frontend Developer", image: "/ahmed.jpg" },
  { id: "marwan", name: "Marwan", role: "Backend Developer", image: "/marwan.jpg" },
];
const copy = {
  en: { title: "Team", lede: "The three people building and running 3S People Management.", soon: "Photo coming soon", lead: "Team Leader", members: "Team members", roles: ["Full Stack Developer", "Frontend Developer", "Backend Developer"], names: ["Mohamed Tarek", "Ahmed Ibrahim", "Marwan"] },
  ar: { title: "الفريق", lede: "الثلاثة اللي بيبنوا ويديروا نظام 3S لإدارة الأفراد.", soon: "الصورة قريباً", lead: "قائد الفريق", members: "أعضاء الفريق", roles: ["مطوّر Full Stack", "مطوّر واجهات أمامية", "مطوّر خلفي"], names: ["محمد طارق", "أحمد إبراهيم", "مروان"] },
};

export default function Team() {
  const [lang, setLang] = useState(() => localStorage.getItem("3s_lang") || document.documentElement.lang || "en");
  useEffect(() => {
    const updateLanguage = (event) => setLang(event.detail);
    window.addEventListener("3s-language-change", updateLanguage);
    return () => window.removeEventListener("3s-language-change", updateLanguage);
  }, []);
  const words = copy[lang];
  return (
    <div className="team-page">
      <Header />
      <main className="team-main">
        <p className="team-eyebrow">3S · PEOPLE MANAGEMENT</p>
        <h1>{words.title}</h1>
        <p className="team-lede">{words.lede}</p>
        <section className="team-wall" aria-label={words.members}>
          {people.map((person, index) => (
            <article className="team-member" key={person.id}>
              <div className="team-photo">
                {person.image ? <img src={person.image} alt={words.names[index]} /> : <div className="team-placeholder" role="img" aria-label={`${words.names[index]} — ${words.soon}`}><b>{person.initials}</b><small>{words.soon}</small></div>}
              </div>
              <div className="team-info">
                <h2>{words.names[index]}</h2>
                <p>{words.roles[index]}</p>
                {person.badge && <span>{words.lead}</span>}
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}



