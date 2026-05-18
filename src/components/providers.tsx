"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#f59e42",
          colorBackground: "#0a0a0a",
          colorText: "#e8e6e3",
          colorInputBackground: "#141414",
          colorInputText: "#e8e6e3",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-[#0a0a0a] shadow-none",
          headerTitle: "text-white",
          headerSubtitle: "text-[#a0a0a0]",
          socialButtonsBlockButton: "border border-[#2a2a2a] hover:border-[#f59e42]/50",
          formFieldLabel: "text-[#a0a0a0]",
          formFieldInput: "bg-[#141414] border-[#2a2a2a] text-white",
          footerActionLink: "text-[#f59e42]",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
