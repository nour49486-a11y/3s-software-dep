import { useCallback, useEffect, useRef, useState } from "react";
import api from "./api.js";

export default function LiveCapture({ onCapture, onError, labels }) {
  const streamUrl = api.getUri({ url: "/live/stream" });
  const [src, setSrc] = useState("");
  const [status, setStatus] = useState("connecting");
  const [attempt, setAttempt] = useState(0);
  const imageRef = useRef(null);
  const retryRef = useRef(null);
  const retriesRef = useRef(0);
  const maxRetries = 5;

  const connect = useCallback(async () => {
    window.clearTimeout(retryRef.current);
    setStatus("connecting");
    try {
      await api.get("/camera/status");
      setSrc(`${streamUrl}?t=${Date.now()}`);
    } catch (error) {
      console.error("Camera API status failed", error);
      setStatus("offline");
    }
  }, [streamUrl]);

  useEffect(() => {
    connect();
    return () => window.clearTimeout(retryRef.current);
  }, [connect]);

  const handleLoad = () => {
    retriesRef.current = 0;
    setAttempt(0);
    setStatus("live");
  };

  const handleError = () => {
    if (retriesRef.current >= maxRetries) {
      setStatus("offline");
      return;
    }
    retriesRef.current += 1;
    setAttempt(retriesRef.current);
    setStatus("retrying");
    retryRef.current = window.setTimeout(connect, 2500);
  };

  const retryNow = () => {
    retriesRef.current = 0;
    setAttempt(0);
    connect();
  };

  const capture = () => {
    const image = imageRef.current;
    if (status !== "live" || !image?.naturalWidth) {
      onError(labels.notLive);
      return;
    }
    try {
      const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      onCapture(canvas.toDataURL("image/jpeg", 0.82));
    } catch {
      onError(labels.captureError);
    }
  };

  const statusText = status === "live" ? labels.live : status === "retrying" ? `${labels.retrying} (${attempt}/${maxRetries})` : status === "offline" ? labels.offline : labels.connecting;

  return (
    <section className="live-capture-card" aria-label={labels.title}>
      <header className="live-capture-heading"><div><strong>{labels.title}</strong><span className={`live-capture-indicator is-${status}`}><i />{statusText}</span></div><button type="button" className="live-retry-button" onClick={retryNow}>{labels.retry}</button></header>
      <div className="live-capture-view">
        {src && <img ref={imageRef} src={src} crossOrigin="anonymous" alt={labels.preview} onLoad={handleLoad} onError={handleError} />}
        {status !== "live" && <div className="live-capture-overlay"><span className={`live-capture-indicator is-${status}`}><i />{statusText}</span></div>}
      </div>
      <button type="button" className="person-button secondary live-capture-button" onClick={capture}>{labels.capture}</button>
    </section>
  );
}
