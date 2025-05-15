"use client"
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function Footer() {
  const { theme, setTheme } = useTheme();
  
  return (
    <footer className={`w-full py-3 border-t border-gray-200 bg-[var(--background)]`}>
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()}. Todos los derechos reservados. Desarrollado por <Link href="https://estudiomq.com.ar" target='_blanck' className="hover:underline">Estudio Mauas</Link>.
        </p>
      </div>
      <div className="container mx-auto px-4 text-center">
        <Link href="/pp" className="text-sm">
          Política de Privacidad
        </Link>
      </div>
    </footer>
  );
}