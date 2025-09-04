import './globals.css';

export const metadata = {
  title: 'Facilities Portal',
  description: 'Submit and manage facility work orders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
