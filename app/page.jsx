"use client";
import dynamic from "next/dynamic";

const AppShell = dynamic(() => import("../components/AppShell"), {
  ssr: false,
  loading: () => (
    <div className="h-screen grid place-items-center">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-pop">🧪</div>
        <p className="font-display font-extrabold text-xl">DataLab</p>
        <p className="text-inkmute text-sm">Setting up your lab…</p>
      </div>
    </div>
  )
});

export default function Page() {
  return <AppShell />;
}
