import './globals.css';

export const metadata = {
  title: "Poongurichi Nanbargal | Blood Network",
  description: "Poongurichi Nanbargal Blood Donor’s Club — one donation can become someone's second chance.",
};

export default function RootLayout({ children }) {
  return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/></head><body>{children}</body></html>;
}
