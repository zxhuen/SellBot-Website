import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign in to SellBot",
  description: "Sign in to SellBot, your AI-powered selling assistant.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
