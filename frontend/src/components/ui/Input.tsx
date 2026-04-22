"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  const baseStyles =
    "w-full px-4 py-3 rounded-[12px] text-[15px] transition-all duration-150 bg-white border-2 border-[#E8E8ED] focus:outline-hidden focus:border-[#007AFF] focus:shadow-md focus:bg-white placeholder:text-[#AEAEB2]";

  const errorStyles = error
    ? "border-[#FF3B30] focus:border-[#FF3B30] focus:shadow-[0_0_0_3px_rgba(255,59,48,0.1)]"
    : "focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]";

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[13px] font-medium text-[#1D1D1F]">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`${baseStyles} ${errorStyles} ${className}`}
      />
      {error && (
        <p className="text-[13px] text-[#FF3B30] font-medium">{error}</p>
      )}
    </div>
  );
}
