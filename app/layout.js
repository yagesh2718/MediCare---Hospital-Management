import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Providers } from "./Providers"; // ✅ import Providers

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MediCare - Doctor's Appointment App",
  description: "Connect with doctors anytime , anywhere",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer>
            <div>Made by Yagesh</div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
