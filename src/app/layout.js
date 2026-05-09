import "./globals.css";

export const metadata = {
  title: "Tawassol — Student Study Platform",
  description: "Collaborate, share, and grow with your study groups.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
