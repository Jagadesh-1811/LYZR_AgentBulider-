import { Inter, Space_Grotesk, Fira_Code } from "next/font/google";
import "./globals.css";
import { MentorAgent } from "@/components/MentorAgent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
});

export const metadata = {
  title: "Lyzr Agent Developer Studio",
  description: "Interactive IDE and telemetry dashboard for configuring, tracing, and validating Retriever Agents.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${firaCode.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900" suppressHydrationWarning>
        {children}
        <MentorAgent />
      </body>
    </html>
  );
}
