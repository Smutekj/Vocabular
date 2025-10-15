import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show native install prompt
    (deferredPrompt as any).prompt();

    const { outcome } = await (deferredPrompt as any).userChoice;
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 16px",
        backgroundColor: "#B12A34",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        zIndex: 1000,
      }}
    >
      Install App
    </button>
  );
}