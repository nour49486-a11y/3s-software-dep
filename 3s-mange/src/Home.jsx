import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import api from "./api.js";
import Header from "./components/Header.jsx";
import ThreeSModel from "./components/ThreeSModel.jsx";
import Footer from "./components/Footer.jsx";
import "./components/layout.css";
import "./home.css";

const PER_PAGE = 10; // أقصى عدد users في الصفحة
const MAX_CHARS = 10; // أول 10 حروف بس من الاسم والتليفون
const short = (text) => {
  const s = String(text ?? "");
  return s.length > MAX_CHARS ? s.slice(0, MAX_CHARS) + "…" : s;
};

const copy = {
  en: {
    eyebrow: "3S — People Management Platform",
    title: "USERS OF 3S.",
    accent: "Your tools should too.",
    body: "One calm place to manage your team: profiles, photos, departments and instant search, built to feel as alive as the people inside it.",
    cta: "See the dashboard",
    ey: "Team directory",
    users: "USERS",
    total: "Total People",
    males: "Males",
    females: "Females",
    refresh: "Refresh",
    add: "Add person",
    search: "Search by all fields…",
    all: "Search all fields",
    name: "Name",
    phone: "Phone",
    age: "Age",
    date: "Birth date",
    email: "Email",
    photo: "Photo",
    gender: "Gender",
    actions: "Actions",
    edit: "Edit",
    remove: "Delete",
    empty: "No people found.",
    loadError: "Could not load people from the API.",
    deleteError: "Could not delete this person.",
    loading: "Loading people…",
    showing: "Showing {from}–{to} of {total} people",
    deleteConfirm: "Delete this person?",
    previous: "Previous page",
    next: "Next page",
  },
  ar: {
    eyebrow: "3S — منصة إدارة الأفراد",
    title: "مستخدمو 3S.",
    accent: "وأدواتك كمان.",
    body: "مكان واحد هادئ لإدارة فريقك: ملفات شخصية وصور وأقسام وبحث فوري، مصمم ليكون نابضًا بالحياة مثل الأشخاص بداخله.",
    cta: "شاهد لوحة المستخدمين",
    ey: "دليل المستخدمين",
    users: "المستخدمون",
    total: "إجمالي المستخدمين",
    males: "الذكور",
    females: "الإناث",
    refresh: "تحديث",
    add: "إضافة مستخدم",
    search: "ابحث في جميع الحقول…",
    all: "كل الحقول",
    name: "الاسم",
    phone: "الهاتف",
    age: "العمر",
    date: "تاريخ الميلاد",
    email: "البريد الإلكتروني",
    photo: "الصورة",
    gender: "النوع",
    actions: "الإجراءات",
    edit: "تعديل",
    remove: "حذف",
    empty: "لا يوجد مستخدمون.",
    loadError: "تعذر تحميل المستخدمين من الـAPI.",
    deleteError: "تعذر حذف المستخدم.",
    loading: "جاري تحميل المستخدمين…",
    showing: "عرض {from}–{to} من {total} مستخدم",
    deleteConfirm: "هل تريد حذف هذا المستخدم؟",
    previous: "الصفحة السابقة",
    next: "الصفحة التالية",
  },
};
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
function ageFromDate(value) {
  if (!value) return "—";
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  )
    age--;
  return Math.max(0, age);
}

export default function Home() {
  const [lang, setLang] = useState(
    () =>
      localStorage.getItem("3s_lang") || document.documentElement.lang || "en",
  );
  const [people, setPeople] = useState([]),
    [query, setQuery] = useState(""),
    [field, setField] = useState("all"),
    [sort, setSort] = useState("none"),
    [currentPage, setCurrentPage] = useState(1),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  const t = copy[lang] || copy.en;
  const loadPeople = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      const response = await api.get("/People");
      setPeople(Array.isArray(response.data) ? response.data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Loading people failed", error);
      setNotice(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);
  useEffect(() => {
    const update = (e) => setLang(e.detail);
    window.addEventListener("3s-language-change", update);
    return () => window.removeEventListener("3s-language-change", update);
  }, []);
  useEffect(() => {
    loadPeople();
  }, [loadPeople]);
  const matchingPeople = useMemo(() => {
    let rows = people.filter((person) => {
      const data = {
        name: person.name,
        phone: person.phone,
        age: ageFromDate(person.birthDate),
        date: person.birthDate,
        email: person.email,
        gender: person.gender,
      };
      const value =
        field === "all" ? Object.values(data).join(" ") : data[field] || "";
      return String(value).toLowerCase().includes(query.trim().toLowerCase());
    });
    if (sort === "name-asc")
      rows = [...rows].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    if (sort === "age-asc")
      rows = [...rows].sort(
        (a, b) => ageFromDate(a.birthDate) - ageFromDate(b.birthDate),
      );
    return rows;
  }, [people, field, query, sort]);
  const totalPages = Math.max(1, Math.ceil(matchingPeople.length / PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const displayed = matchingPeople.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );
  const removePerson = async (person) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.delete(`/People/${person.id}`);
      setPeople((current) => current.filter((item) => item.id !== person.id));
    } catch (error) {
      console.error("Delete person failed", error);
      setNotice(error.response?.data?.message || t.deleteError);
    }
  };
  const males = people.filter(
    (person) => String(person.gender || "").toLowerCase() === "male",
  ).length;
  const females = people.filter(
    (person) => String(person.gender || "").toLowerCase() === "female",
  ).length;
  const rangeFrom = matchingPeople.length
    ? (currentPage - 1) * PER_PAGE + 1
    : 0;
  const rangeTo = Math.min(currentPage * PER_PAGE, matchingPeople.length);
  return (
    <div className="landing home-page">
      <section className="hero" id="hero">
        <Header />
        <ThreeSModel />
        <div className="sp" />
        <div id="content">
          <div className="home-hero-copy" id="about">
            <div>
              <p className="home-eyebrow">{t.eyebrow}</p>
              <h1>
                <span>{t.title}</span>
                <span>
                  <i>{t.accent}</i>
                </span>
              </h1>
            </div>
            <div className="home-hero-summary">
              <p>{t.body}</p>
              <a className="home-cta" href="#directory">
                {t.cta}
                <span aria-hidden="true">↘</span>
              </a>
            </div>
          </div>
        </div>
      </section>
      <main className="home-directory" id="directory">
        <header className="directory-heading">
          <div>
            <p className="directory-eyebrow">{t.ey}</p>
            <h2>{t.users}</h2>
          </div>
          <div className="directory-actions">
            <button
              type="button"
              className="directory-button"
              onClick={loadPeople}
              disabled={loading}
            >
              <span aria-hidden="true">↻</span>
              {t.refresh}
            </button>
            <Link className="directory-button primary" to="/admin/newuser">
              <span className="directory-add-icon" aria-hidden="true">
                +
              </span>
              {t.add}
            </Link>
          </div>
        </header>
        {notice && (
          <p className="directory-notice" role="alert">
            {notice}
          </p>
        )}
        <section
          className="directory-stats"
          aria-label={
            lang === "ar" ? "إحصائيات المستخدمين" : "People statistics"
          }
        >
          {[
            [t.total, people.length],
            [t.males, males],
            [t.females, females],
          ].map(([label, count], i) => (
            <article className="directory-stat" key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
              <i className={`stat-orb orb-${i}`} aria-hidden="true" />
            </article>
          ))}
        </section>
        <section
          className="directory-tools"
          aria-label={lang === "ar" ? "البحث والفرز" : "Search and sort"}
        >
          <label className="directory-search">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.search}
            />
          </label>
          <select
            value={field}
            onChange={(e) => {
              setField(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={t.all}
          >
            <option value="all">{t.all}</option>
            {["name", "phone", "age", "date", "email"].map((key) => (
              <option value={key} key={key}>
                {t[key]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
            aria-label={lang === "ar" ? "ترتيب حسب" : "Sort by"}
          >
            <option value="none">
              {lang === "ar" ? "ترتيب حسب" : "Sort by"}
            </option>
            <option value="name-asc">
              {lang === "ar" ? "الاسم (أ-ي)" : "Name (A-Z)"}
            </option>
            <option value="age-asc">
              {lang === "ar" ? "العمر (الأصغر أولًا)" : "Age (youngest first)"}
            </option>
          </select>
        </section>
        <section className="directory-table-card">
          <div className="directory-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t.photo}</th>
                  <th>{t.name}</th>
                  <th>{t.gender}</th>
                  <th>{t.phone}</th>
                  <th>{t.email}</th>
                  <th>{t.date}</th>
                  <th>{t.age}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="directory-empty">
                      {t.loading}
                    </td>
                  </tr>
                ) : displayed.length ? (
                  displayed.map((person, i) => (
                    <tr key={person.id}>
                      <td>{(currentPage - 1) * PER_PAGE + i + 1}</td>
                      <td>
                        {person.picture ? (
                          <img
                            className="person-thumbnail"
                            src={person.picture}
                            alt=""
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td title={person.name}>{short(person.name)}</td>
                      <td>{person.gender}</td>
                      <td title={person.phone}>{short(person.phone)}</td>
                      <td>{person.email}</td>
                      <td>
                        {person.birthDate
                          ? String(person.birthDate).slice(0, 10)
                          : "—"}
                      </td>
                      <td>{ageFromDate(person.birthDate)}</td>
                      <td>
                        <Link to={`/edit/${person.id}`}>{t.edit}</Link>
                        <button
                          type="button"
                          onClick={() => removePerson(person)}
                        >
                          {t.remove}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="directory-empty">
                      {t.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="directory-table-footer">
            <span>
              {t.showing
                .replace("{from}", String(rangeFrom))
                .replace("{to}", String(rangeTo))
                .replace("{total}", String(matchingPeople.length))}
            </span>
            <nav aria-label={lang === "ar" ? "صفحات الجدول" : "Table pages"}>
              <button
                type="button"
                disabled={currentPage <= 1}
                aria-label={t.previous}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                ‹
              </button>
              <button
                type="button"
                className="current-page"
                aria-current="page"
              >
                {currentPage} / {totalPages}
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                aria-label={t.next}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                ›
              </button>
            </nav>
          </footer>
        </section>
      </main>
      <Footer />
    </div>
  );
}
