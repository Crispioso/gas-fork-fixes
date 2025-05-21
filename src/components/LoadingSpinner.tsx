"use client";
export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-neonPink border-b-4 border-neonCyan"></div>
    </div>
  );
}
