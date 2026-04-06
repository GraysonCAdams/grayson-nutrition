import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

let toastCounter = 0;

export function usePositiveFeedback() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  };

  return { toasts, showToast };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} message={toast.message} />
      ))}
    </div>
  );
}

function ToastItem({ message }: { message: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        bg-white text-gray-800 px-5 py-2.5 rounded-2xl shadow-lg border border-gray-100
        font-bold text-base transition-all duration-300
        ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-90"}
      `}
    >
      🎉 {message}
    </div>
  );
}
