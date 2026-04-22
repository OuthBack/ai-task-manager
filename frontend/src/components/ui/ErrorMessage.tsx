'use client';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-[12px] bg-gradient-to-r from-[#FF3B30]/10 to-[#e62e27]/10 border-2 border-[#FF3B30]/30 shadow-md animate-slideDown">
      <div className="flex items-center gap-3">
        <span className="text-[#FF3B30] text-lg font-bold">⚠</span>
        <p className="text-[13px] text-[#FF3B30] font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-[#FF3B30] hover:opacity-70 transition-opacity duration-150 text-sm font-bold"
          aria-label="Close error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
