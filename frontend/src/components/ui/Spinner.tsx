'use client';

export function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="inline-block w-5 h-5 rounded-full border-3 border-transparent border-t-[#34C759] border-r-[#007AFF] animate-spin shadow-sm"
        aria-label="loading"
      />
    </div>
  );
}
