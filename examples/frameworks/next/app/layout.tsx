import type { ReactNode } from "react";
export const metadata = { title: "OnoDocs Next.js viewer" };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><head><link rel="stylesheet" href="/style.css" /></head><body>{children}</body></html>;
}
