import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { clearApiSession, getTokenRoles } from "./api.js";
import logoDark from "./assets/3s-people-management.svg";
import logoLight from "./assets/3s-people-management-light.svg";
import api from "./api.js";

const copy = {
  en: {
    light: "Light mode",
    dark: "Dark mode",
    arabic: "العربية",
    english: "English",
    signin: "Sign in",
    signup: "Create account",
    reset: "Reset password",
    emailPrompt: "Enter your email and we'll send you a reset link.",
    welcome: "Welcome to 3S People Management.",
    createWelcome: "Create your 3S People Management account.",
    email: "Email",
    sendReset: "Send reset link",
    back: "Back to sign in",
    fullName: "Full name",
    username: "Username",
    password: "Password",
    remember: "Remember me",
    forgot: "Forgot password?",
    or: "Or continue with",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
    already: "Already have an account?",
    noAccount: "Don't have an account?",
    createOne: "Create one",
    resetMessage:
      "If an account exists for this email, a reset link will be sent.",
  },
  ar: {
    light: "الوضع الفاتح",
    dark: "الوضع الداكن",
    arabic: "العربية",
    english: "English",
    signin: "تسجيل الدخول",
    signup: "إنشاء حساب",
    reset: "إعادة تعيين كلمة المرور",
    emailPrompt: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
    welcome: "مرحبًا بك في 3S لإدارة الأفراد.",
    createWelcome: "أنشئ حسابك في 3S لإدارة الأفراد.",
    email: "البريد الإلكتروني",
    sendReset: "إرسال رابط التعيين",
    back: "العودة لتسجيل الدخول",
    fullName: "الاسم بالكامل",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    or: "أو تابع باستخدام",
    google: "المتابعة باستخدام Google",
    facebook: "المتابعة باستخدام Facebook",
    already: "لديك حساب بالفعل؟",
    noAccount: "ليس لديك حساب؟",
    createOne: "إنشاء حساب",
    resetMessage:
      "إذا كان هناك حساب بهذا البريد، فسيتم إرسال رابط إعادة التعيين.",
  },
};
function ThemeIcon({ dark }) {
  return dark ? (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24">
      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.97-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

export default function Login() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("3s_theme") ||
      document.documentElement.dataset.theme ||
      "light",
  );
  const [lang, setLang] = useState(
    () =>
      localStorage.getItem("3s_lang") || document.documentElement.lang || "en",
  );
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const t = copy[lang] || copy.en;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("3s_theme", theme);
    localStorage.setItem("3s_lang", lang);
    window.dispatchEvent(
      new CustomEvent("3s-language-change", { detail: lang }),
    );
  }, [theme, lang]);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/bg.js";
    script.async = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, []);
  const isLogin = mode === "login",
    isSignup = mode === "signup",
    isForgot = mode === "forgot";
  function changeMode(next) {
    setMode(next);
    setMessage("");
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      setLoading(true);
      if (isLogin) {
        const response = await api.post("/auth/login", {
          username: String(form.get("username") || "").trim(),
          password: String(form.get("password") || ""),
        });
        const { token, name } = response.data || {};
        if (!token) throw new Error("The API response did not include a token.");
        clearApiSession();
        const storage = form.get("remember") === "on" ? localStorage : sessionStorage;
        storage.setItem("3s_token", token);
        storage.setItem("3s_user", name || "");
        navigate(getTokenRoles(token).includes("admin") ? "/admin" : "/home", { replace: true });
      } else if (isSignup) {
        await api.post("/auth/register", {
          name: String(form.get("fullName") || "").trim(),
          email: String(form.get("email") || "").trim(),
          password: String(form.get("password") || ""),
        });
        setMessage(lang === "ar" ? "تم إنشاء الحساب. سجّل الدخول الآن." : "Account created. Sign in now.");
        setMode("login");
      } else {
        setMessage(lang === "ar" ? "واجهة الـAPI لا تحتوي حاليًا على مسار لإعادة تعيين كلمة المرور." : "The API does not currently provide a password reset endpoint.");
      }
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      setMessage(apiMessage || (lang === "ar" ? "تعذر إتمام الطلب. تحقق من اتصال الـAPI والبيانات." : "The request failed. Check the API connection and submitted details."));
    } finally {
      setLoading(false);
    }
  }
  const field =
    "mb-4 h-12 w-full rounded-2xl border border-white/15 bg-white/10 px-5 text-[18px] text-white outline-none focus:border-[#58c8f0]";
  const label = "mb-2 inline-block text-[16px] font-medium text-white/65";
  return (
    <div
      className="login-page flex flex-col"
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <header className="login-header fixed left-0 top-0 z-10 flex w-full items-center justify-between p-4">
        <img
          className="h-20 w-65 object-contain"
          src={theme === "light" ? logoLight : logoDark}
          alt="3S People Management"
        />
        <div className="login-header-actions">
          <button
            type="button"
            className="login-header-pill"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <ThemeIcon dark={theme === "dark"} />
            <span>{theme === "dark" ? t.light : t.dark}</span>
          </button>
          <button
            type="button"
            className="login-header-pill"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          >
            <GlobeIcon />
            <span>{lang === "ar" ? t.english : t.arabic}</span>
          </button>
        </div>
      </header>
      <section className="login-layout flex h-dvh items-center justify-center px-4 pt-20">
        <div className="login-card w-165 max-w-full rounded-4xl border border-white/10 bg-white/8 px-6 py-10 shadow-2xl shadow-black/20 backdrop-blur-2xl backdrop-saturate-150 sm:px-18 sm:py-17.5">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center text-gray-300">
              <h1 className="text-center text-[42px] font-semibold leading-none tracking-tight text-[#eaf3fb] sm:text-[56px]">
                {isForgot ? t.reset : isSignup ? t.signup : t.signin}
              </h1>
              <p className="mt-4 text-center text-[18px] text-white/60 sm:text-[22px]">
                {isForgot
                  ? t.emailPrompt
                  : isSignup
                    ? t.createWelcome
                    : t.welcome}
              </p>
              <div className="mt-12 w-full">
                {isForgot ? (
                  <>
                    <label htmlFor="reset-email" className={label}>
                      {t.email}
                    </label>
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={field}
                    />
                    <button type="submit" className="login-submit">
                      {t.sendReset}
                    </button>
                    {message && (
                      <p
                        role="status"
                        className="mt-4 text-center text-white/70"
                      >
                        {message}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => changeMode("login")}
                      className="login-text-button mt-6"
                    >
                      {t.back}
                    </button>
                  </>
                ) : (
                  <>
                    {isSignup && (
                      <>
                        <label htmlFor="full-name" className={label}>
                          {t.fullName}
                        </label>
                        <input
                          id="full-name"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          required
                          className={field}
                        />
                        <label htmlFor="signup-email" className={label}>
                          {t.email}
                        </label>
                        <input
                          id="signup-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className={field}
                        />
                      </>
                    )}
                    {isLogin && <>
                      <label htmlFor="username" className={label}>{t.username}</label>
                      <input id="username" name="username" type="text" autoComplete="username" required className={field} />
                    </>}
                    <label htmlFor="password" className={label}>
                      {t.password}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        isSignup ? "new-password" : "current-password"
                      }
                      required
                      className={field}
                    />
                    {!isSignup && (
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-white/60">
                          <input
                            name="remember"
                            type="checkbox"
                            className="h-5 w-5 accent-[#58c8f0]"
                          />
                          {t.remember}
                        </label>
                        <button
                          type="button"
                          onClick={() => changeMode("forgot")}
                          className="text-white/70 underline"
                        >
                          {t.forgot}
                        </button>
                      </div>
                    )}
                    <button type="submit" className="login-submit" disabled={loading}>
                      {loading ? (lang === "ar" ? "جارٍ الإرسال…" : "Please wait…") : isSignup ? t.signup : t.signin}
                    </button>
                    {isLogin && (
                      <>
                        <div className="mt-6 flex w-full items-center gap-4 text-[16px] text-white/50">
                          <span className="h-px flex-1 bg-white/15" />
                          <span>{t.or}</span>
                          <span className="h-px flex-1 bg-white/15" />
                        </div>
                        <div className="mt-6 flex w-full flex-col gap-3">
                          <button type="button" className="login-social" onClick={() => setMessage(lang === "ar" ? "تسجيل الدخول الاجتماعي غير متاح في الـAPI الحالي." : "Social sign-in is not available in the current API.")}>
                            <GoogleIcon />
                            <span>{t.google}</span>
                          </button>
                          <button type="button" className="login-social" onClick={() => setMessage(lang === "ar" ? "تسجيل الدخول الاجتماعي غير متاح في الـAPI الحالي." : "Social sign-in is not available in the current API.")}>
                            <FacebookIcon />
                            <span>{t.facebook}</span>
                          </button>
                        </div>
                      </>
                    )}
                    <p className="mt-6 text-center text-[17px] text-white/60">
                      {isSignup ? t.already : t.noAccount}{" "}
                      <button
                        type="button"
                        onClick={() =>
                          changeMode(isSignup ? "login" : "signup")
                        }
                        className="font-semibold text-white underline underline-offset-4"
                      >
                        {isSignup ? t.signin : t.createOne}
                      </button>
                    </p>
                  </>
                )}
                {message && !isForgot && <p role="alert" className="mt-4 text-center text-white/80">{message}</p>}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}







