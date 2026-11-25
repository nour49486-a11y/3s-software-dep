import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import api from "./api.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import LiveCapture from "./LiveCapture.jsx";
import "./person-form.css";

const SizeStyle = Quill.import("attributors/style/size");
const FONT_SIZES = Array.from({ length: 150 }, (_, index) => `${index + 1}px`);
SizeStyle.whitelist = FONT_SIZES;
Quill.register(SizeStyle, true);

const copy = {
  en: { add: "Add new user", edit: "Edit user", intro: "Create a complete people profile.", editIntro: "Update the details for this profile.", api: "Could not save the user. Check the API and try again.", loadError: "Could not load this user from the API.", loadingUser: "Loading user details…", saved: "User saved successfully.", photo: "Profile photo", upload: "Upload photo", camera: "Use camera", capture: "Capture", cancel: "Cancel", name: "Full name", gender: "Gender", choose: "Choose gender", male: "Male", female: "Female", phone: "Phone", email: "Email", birth: "Birth date", description: "Description", placeholder: "Add a short description…", fontSize: "Font size", textColor: "Text color", backgroundColor: "Text background", save: "Save user", update: "Save changes", back: "Back to admin", missingId: "No user ID was provided. Add an ID to the edit URL when connecting the API.", cameraError: "Could not open the camera. Check your browser permission and try again.", cameraUnavailable: "Camera is not available in this browser.", preview: "Profile photo preview", photoHint: "JPG, PNG, or WebP", error: "Something went wrong while processing the photo.", liveTitle: "Live camera", connecting: "Connecting…", live: "Live", retrying: "Reconnecting", offline: "Camera unavailable", retry: "Retry connection", captureLive: "Capture live image", previewLive: "Live camera preview", notLive: "The live camera is not connected yet.", captureError: "Could not capture the live image. Check the stream CORS settings." },
  ar: { add: "إضافة مستخدم جديد", edit: "تعديل المستخدم", intro: "أضف بيانات المستخدم وصورته الشخصية.", editIntro: "عدّل بيانات الملف الشخصي.", api: "تعذر حفظ المستخدم. تحقق من الـAPI وحاول مرة أخرى.", loadError: "تعذر تحميل بيانات المستخدم من الـAPI.", loadingUser: "جاري تحميل بيانات المستخدم…", saved: "تم حفظ المستخدم بنجاح.", photo: "الصورة الشخصية", upload: "رفع صورة", camera: "فتح الكاميرا", capture: "التقاط الصورة", cancel: "إلغاء", name: "الاسم بالكامل", gender: "النوع", choose: "اختر النوع", male: "ذكر", female: "أنثى", phone: "رقم الهاتف", email: "البريد الإلكتروني", birth: "تاريخ الميلاد", description: "الوصف", placeholder: "اكتب وصفًا مختصرًا…", fontSize: "حجم الخط", textColor: "لون النص", backgroundColor: "لون خلفية النص", save: "حفظ المستخدم", update: "حفظ التعديلات", back: "العودة للإدارة", missingId: "لا يوجد رقم للمستخدم. أضف الرقم إلى رابط التعديل عند ربط الـAPI.", cameraError: "تعذر فتح الكاميرا. تحقق من إذن المتصفح وحاول مرة أخرى.", cameraUnavailable: "الكاميرا غير متاحة في هذا المتصفح.", preview: "معاينة الصورة الشخصية", photoHint: "JPG أو PNG أو WebP", error: "حدث خطأ أثناء تجهيز الصورة.", liveTitle: "البث المباشر", connecting: "جاري الاتصال…", live: "متصل", retrying: "إعادة الاتصال", offline: "الكاميرا غير متاحة", retry: "إعادة المحاولة", captureLive: "التقاط من البث المباشر", previewLive: "معاينة البث المباشر", notLive: "البث المباشر غير متصل حاليًا.", captureError: "تعذر التقاط الصورة. تحقق من إعدادات CORS للبث." },
};

async function compressPhoto(file) {
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = source;
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
  const scale = Math.min(1, 480 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

const fieldValue = (record, ...keys) => keys.map((key) => record?.[key]).find((value) => value !== undefined && value !== null);

export default function PersonForm({ mode = "add", userId }) {
  const [lang, setLang] = useState(() => localStorage.getItem("3s_lang") || document.documentElement.lang || "en");
  const [fields, setFields] = useState({ name: "", gender: "", phone: "", email: "", birthDate: "" });
  const [photo, setPhoto] = useState("");
  const [descriptionHTML, setDescriptionHTML] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const navigate = useNavigate();
  const [cameraError, setCameraError] = useState("");
  const fileRef = useRef(null);
  const descriptionRef = useRef(null);
  const quillRef = useRef(null);
  const descriptionRangeRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const dialogRef = useRef(null);
  const streamRef = useRef(null);
  const editing = mode === "edit";
  const t = copy[lang] || copy.en;

  useEffect(() => {
    if (!descriptionRef.current) return undefined;
    const editor = new Quill(descriptionRef.current, {
      theme: "snow",
      placeholder: t.placeholder,
      modules: {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }, { direction: "rtl" }],
          ["blockquote", "link"],
          ["clean"],
        ],
      },
    });
    quillRef.current = editor;
    editor.on("selection-change", (range) => {
      if (range) descriptionRangeRef.current = range;
    });
    editor.root.setAttribute("aria-label", t.description);
    editor.getModule("toolbar").container.setAttribute("aria-label", t.description);
    if (descriptionHTML) editor.clipboard.dangerouslyPasteHTML(descriptionHTML);
    return () => {
      editor.disable();
      editor.getModule("toolbar").container.remove();
      descriptionRef.current?.replaceChildren();
      descriptionRef.current?.classList.remove("ql-container", "ql-snow");
      quillRef.current = null;
    };
  }, []);

  const rememberDescriptionSelection = () => {
    const range = quillRef.current?.getSelection();
    if (range) descriptionRangeRef.current = range;
  };

  const setDescriptionFormat = (format, value) => {
    const editor = quillRef.current;
    if (!editor) return;
    editor.focus();
    if (descriptionRangeRef.current) editor.setSelection(descriptionRangeRef.current, "silent");
    editor.format(format, value, "user");
  };

  useEffect(() => {
    if (quillRef.current && descriptionHTML) {
      quillRef.current.clipboard.dangerouslyPasteHTML(descriptionHTML);
    }
  }, [descriptionHTML]);

  useEffect(() => {
    const backgroundScript = document.createElement("script");
    backgroundScript.src = "/bg.js";
    backgroundScript.async = true;
    document.body.appendChild(backgroundScript);
    const update = (event) => setLang(event.detail);
    window.addEventListener("3s-language-change", update);
    return () => {
      window.removeEventListener("3s-language-change", update);
      backgroundScript.remove();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!editing || !userId) return;
    let active = true;
    setLoadingUser(true);
    api.get(`/People/${encodeURIComponent(userId)}`)
      .then(({ data }) => {
        if (!active) return;
        const name = fieldValue(data, "name", "Name") || "";
        const gender = fieldValue(data, "gender", "Gender") || "";
        const phone = fieldValue(data, "phone", "Phone") || "";
        const email = fieldValue(data, "email", "Email") || "";
        const birthDate = fieldValue(data, "birthDate", "BirthDate") || "";
        setFields({ name, gender: String(gender).toLowerCase(), phone: String(phone).replace(/\D/g, "").slice(0, 10), email, birthDate: String(birthDate).slice(0, 10) });
        setPhoto(fieldValue(data, "picture", "Picture", "profilePicture", "ProfilePicture") || "");
        setDescriptionHTML(fieldValue(data, "description", "Description") || "");
      })
      .catch((error) => {
        console.error("Could not load person", error);
        if (active) setNotice(error.response?.data?.message || t.loadError);
      })
      .finally(() => { if (active) setLoadingUser(false); });
    return () => { active = false; };
  }, [editing, userId, t.loadError]);
  const updateField = (event) => {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value }));
  };
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { setPhoto(await compressPhoto(file)); setNotice(""); }
    catch { setNotice(t.error); }
    event.target.value = "";
  };
  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    dialogRef.current?.close();
  };
  const openCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t.cameraUnavailable);
      dialogRef.current?.showModal();
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      dialogRef.current?.showModal();
      if (videoRef.current) videoRef.current.srcObject = streamRef.current;
    } catch {
      setCameraError(t.cameraError);
      dialogRef.current?.showModal();
    }
  };
  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.videoWidth || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    closeCamera();
  };
  const submit = async (event) => {
    event.preventDefault();
    setNotice("");
    setSaving(true);
    const person = {
      name: fields.name.trim(),
      gender: fields.gender,
      phone: fields.phone,
      email: fields.email.trim(),
      birthDate: fields.birthDate,
      description: quillRef.current?.root.innerHTML.trim() || "",
      picture: photo || null,
    };
    try {
      if (editing) {
        await api.put(`/People/${encodeURIComponent(userId)}`, { id: Number(userId), ...person });
      } else {
        await api.post("/People", person);
      }
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Could not save person", error);
      setNotice(error.response?.data?.message || t.api);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="person-form-page">
      <Header />
      <main className="person-form-main">
        <header className="person-form-heading">
          <div><p className="person-form-eyebrow">3S · PEOPLE MANAGEMENT</p><h1>{editing ? t.edit : t.add}</h1><p>{editing ? t.editIntro : t.intro}</p></div>
          {editing && <span className="person-form-id">ID · {userId || "—"}</span>}
        </header>
        {editing && !userId && <p className="person-form-notice" role="status">{t.missingId}</p>}{loadingUser && <p className="person-form-notice" role="status">{t.loadingUser}</p>}
        <form className="person-form-card" onSubmit={submit}>
          <section className="person-photo-section">
            <div className="person-photo-preview" aria-label={t.preview}>{photo ? <img src={photo} alt={t.preview} /> : <span aria-hidden="true">{fields.name.trim().slice(0, 1).toUpperCase() || "3S"}</span>}</div>
            <div className="person-photo-controls"><strong>{t.photo}</strong><small>{t.photoHint}</small><div className="person-form-actions"><input ref={fileRef} className="visually-hidden" type="file" accept="image/*" onChange={choosePhoto} /><button className="person-button secondary" type="button" onClick={() => fileRef.current?.click()}>{t.upload}</button><button className="person-button secondary" type="button" onClick={openCamera}>{t.camera}</button></div></div>
          </section>
          <LiveCapture onCapture={(image) => { setPhoto(image); setNotice(""); }} onError={setNotice} labels={{ title: t.liveTitle, connecting: t.connecting, live: t.live, retrying: t.retrying, offline: t.offline, retry: t.retry, capture: t.captureLive, preview: t.previewLive, notLive: t.notLive, captureError: t.captureError }} />
          <div className="person-fields-grid">
            <label className="person-field"><span>{t.name}</span><input name="name" value={fields.name} onChange={updateField} autoComplete="name" required /></label>
            <label className="person-field"><span>{t.gender}</span><select name="gender" value={fields.gender} onChange={updateField} required><option value="">{t.choose}</option><option value="male">{t.male}</option><option value="female">{t.female}</option></select></label>
            <label className="person-field"><span>{t.phone}</span><input name="phone" type="tel" inputMode="numeric" maxLength={10} value={fields.phone} onChange={updateField} autoComplete="tel" required /></label>
            <label className="person-field"><span>{t.email}</span><input name="email" type="email" value={fields.email} onChange={updateField} autoComplete="email" required /></label>
            <label className="person-field"><span>{t.birth}</span><input name="birthDate" type="date" value={fields.birthDate} onChange={updateField} required /></label>
          </div>
          <section className="person-description">
            <label id="person-description-label">{t.description}</label>
            <div className="person-description-color-pickers">
              <label className="person-description-color"><span>{t.textColor}</span><input type="color" defaultValue="#eaf4fc" aria-label={t.textColor} onMouseDown={rememberDescriptionSelection} onTouchStart={rememberDescriptionSelection} onChange={(event) => setDescriptionFormat("color", event.target.value)} /></label>
              <label className="person-description-color"><span>{t.backgroundColor}</span><input type="color" defaultValue="#ffeb3b" aria-label={t.backgroundColor} onMouseDown={rememberDescriptionSelection} onTouchStart={rememberDescriptionSelection} onChange={(event) => setDescriptionFormat("background", event.target.value)} /></label>
              <label className="person-description-size"><span>{t.fontSize}</span><select defaultValue="16" aria-label={t.fontSize} onMouseDown={rememberDescriptionSelection} onTouchStart={rememberDescriptionSelection} onChange={(event) => setDescriptionFormat("size", `${event.target.value}px`)}>{FONT_SIZES.map((size) => <option key={size} value={Number.parseInt(size, 10)}>{size.replace("px", " px")}</option>)}</select></label>
            </div>
            <div ref={descriptionRef} className="person-quill-editor" aria-labelledby="person-description-label" />
          </section>
          {notice && <p className="person-form-notice" role="status">{notice}</p>}
          <footer className="person-form-footer"><Link className="person-button secondary" to="/admin">{t.back}</Link><button className="person-button primary" type="submit" disabled={saving || loadingUser || (editing && !userId)}>{saving ? (lang === "ar" ? "جاري الحفظ…" : "Saving…") : editing ? t.update : t.save}</button></footer>
        </form>
      </main>
      <Footer />
      <dialog className="person-camera-dialog" ref={dialogRef} onClose={() => streamRef.current?.getTracks().forEach((track) => track.stop())}><header><h2>{t.camera}</h2><button type="button" aria-label={t.cancel} onClick={closeCamera}>×</button></header>{cameraError ? <p>{cameraError}</p> : <video ref={videoRef} autoPlay playsInline /> }<canvas ref={canvasRef} hidden /><footer>{!cameraError && <button className="person-button primary" type="button" onClick={capture}>{t.capture}</button>}<button className="person-button secondary" type="button" onClick={closeCamera}>{t.cancel}</button></footer></dialog>
    </div>
  );
}







