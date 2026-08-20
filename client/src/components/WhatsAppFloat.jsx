import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext.jsx';
import { onlyDigits } from '../utils/format.js';

export default function WhatsAppFloat() {
  const { config } = useStore();
  const number = onlyDigits(config.whatsapp || config.whatsappNumber);
  if (!number) return null;
  const message = encodeURIComponent(
    `Olá! Vim pelo site e gostaria de fazer um pedido. 🍔`
  );
  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={28} fill="currentColor" />
    </a>
  );
}
