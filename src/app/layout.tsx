import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__:
      import("@tanstack/react-query").QueryClient;
  }
}