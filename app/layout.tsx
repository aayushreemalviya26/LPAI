import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/lato/900.css";

import "./globals.css";
export const metadata = {
  title: "LAABH powered by LPAI | Rupaidiha",
  description:
    "A research prototype connecting passenger transport demand with demo local providers.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

