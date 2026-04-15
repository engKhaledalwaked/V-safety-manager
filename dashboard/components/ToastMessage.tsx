import React, { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessageProps {
  isOpen: boolean;
  message: string;
  type?: ToastType;
  durationMs?: number;
  onClose: () => void;
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-blue-600'
};

const ToastMessage: React.FC<ToastMessageProps> = ({
  isOpen,
  message,
  type = 'info',
  durationMs = 2800,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      onClose();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-5 right-5 z-[120]">
      <div className={`text-white text-sm px-4 py-3 rounded-lg shadow-xl ${typeClasses[type]}`}>
        {message}
      </div>
    </div>
  );
};

export default ToastMessage;
