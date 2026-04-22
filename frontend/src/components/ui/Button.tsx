"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full flex items-center justify-center gap-2 " +
    "px-6 py-[14px] rounded-[14px] " +
    "text-[16px] font-semibold tracking-[0.01em] " +
    "transition-all duration-120 ease-out cursor-pointer " +
    "active:scale-[0.97] hover:brightness-110 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variantStyles: Record<string, string> = {
    primary: "bg-blue-600 text-white focus-visible:ring-blue-500",
    secondary:
      "bg-slate-100 text-slate-800 border border-slate-300 focus-visible:ring-slate-400",
    success: "bg-green-600 text-white focus-visible:ring-green-500",
    danger: "bg-red-600 text-white focus-visible:ring-red-500",
    purple: "bg-violet-600 text-white focus-visible:ring-violet-500",
    amber: "bg-amber-600 text-white focus-visible:ring-amber-500",
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
