"use client";

import { Suspense } from "react";
import { SignInClient } from "./signin-client";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignInClient />
    </Suspense>
  );
}
