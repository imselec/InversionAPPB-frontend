import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const MESSAGES = [
  'Conectando con el servidor...',
  'Cargando datos del mercado...',
  'Obteniendo precios actuales...',
  'Preparando tu portfolio...',
  'Casi listo...',
];

export function AppLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 4000);
    const dotTimer = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => {
      clearInterval(msgTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-8 px-8">
      {/* Logo / Icon */}
      <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
        <TrendingUp className="w-10 h-10 text-primary" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Investment Advisor</h1>
        <p className="text-sm text-text-muted">Tu gestor de inversiones personal</p>
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-text-secondary text-center min-h-[20px]">
          {MESSAGES[msgIndex]}{dots}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-surface rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>

      <p className="text-xs text-text-muted text-center max-w-xs">
        El servidor puede tardar hasta 60 segundos en arrancar la primera vez.
      </p>
    </div>
  );
}
