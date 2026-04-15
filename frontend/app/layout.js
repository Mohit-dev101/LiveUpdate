import "./globals.css";

export const metadata = {
  title: "Live CRUD Workspace",
  description: "Next.js frontend connected to a Node.js real-time CRUD API."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
