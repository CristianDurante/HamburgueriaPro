import { useEffect, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import { api } from '../../api.js';
import SmartImage from '../../components/SmartImage.jsx';
import { onlyDigits } from '../../utils/format.js';

const PROVIDERS = [
  { id: 'wa.me', label: 'Link direto (wa.me)', desc: 'Abre o WhatsApp com a mensagem pronta. Não requer API.' },
  { id: 'evolution', label: 'Evolution API', desc: 'Envia automaticamente via Evolution API.' },
  { id: 'zapi', label: 'Z-API', desc: 'Envia automaticamente via Z-API.' },
  { id: 'twilio', label: 'Twilio WhatsApp', desc: 'Envia automaticamente via Twilio.' },
  { id: 'http', label: 'HTTP API genérica', desc: 'POST para uma URL própria com { to, message }.' },
];

export default function AdminSettings() {
  const [form, setForm] = useState({});
  const [hours, setHours] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/admin/settings'), api.get('/admin/settings/hours')])
      .then(([s, h]) => {
        setForm({
          store_name: s.name || '',
          store_phone: s.phone || '',
          store_whatsapp: s.whatsapp || '',
          store_address: s.address || '',
          store_logo: s.logo || '',
          delivery_fee: String(s.deliveryFee ?? ''),
          delivery_neighborhoods: (s.neighborhoods || []).join(', '),
          min_order: String(s.minOrder ?? ''),
          avg_delivery_time: s.avgDeliveryTime || '',
          block_when_closed: s.blockWhenClosed,
          accept_delivery: s.acceptDelivery,
          accept_pickup: s.acceptPickup,
          whatsapp_provider: s.whatsappProvider || 'wa.me',
          whatsapp_api_url: s.whatsappApiUrl || '',
          whatsapp_api_token: '',
          whatsapp_number: onlyDigits(s.whatsappNumber || s.whatsapp || ''),
          pix_key: s.pixKey || '',
        });
        setHours(Array.isArray(h) ? h : []);
      })
      .catch(() => {});
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/admin/settings', {
        store_name: form.store_name,
        store_phone: form.store_phone,
        store_whatsapp: form.store_whatsapp,
        store_address: form.store_address,
        delivery_fee: form.delivery_fee,
        delivery_neighborhoods: (form.delivery_neighborhoods || '').split(',').map((n) => n.trim()).filter(Boolean),
        min_order: form.min_order,
        avg_delivery_time: form.avg_delivery_time,
        block_when_closed: !!form.block_when_closed,
        accept_delivery: !!form.accept_delivery,
        accept_pickup: !!form.accept_pickup,
        whatsapp_provider: form.whatsapp_provider,
        whatsapp_api_url: form.whatsapp_api_url,
        whatsapp_api_token: form.whatsapp_api_token || undefined,
        whatsapp_number: form.whatsapp_number,
        pix_key: form.pix_key,
      });
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        const uploaded = await api.upload('/admin/settings/logo', fd);
        set('store_logo', uploaded.logo);
        setLogoFile(null);
      }
      await api.put('/admin/settings/hours', hours);
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Configurações</h1>
          <p>Dados da hamburgueria, entregas e integração WhatsApp</p>
        </div>
      </div>
      {message && <div className="alert-success">{message}</div>}

      <form onSubmit={handleSave}>
        <div className="panel form-section">
          <h3>Identidade da hamburgueria</h3>
          <div className="admin-form-grid">
            <div className="form-field">
              <label>Nome</label>
              <input value={form.store_name} onChange={(e) => set('store_name', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Logo</label>
              <div className="image-uploader small">
                {form.store_logo || logoFile ? (
                  <div className="image-preview">
                    <SmartImage src={logoFile ? URL.createObjectURL(logoFile) : form.store_logo} alt="Logo" />
                  </div>
                ) : null}
                <label htmlFor="store-logo-upload" className="upload-placeholder">
                  <Upload size={16} /> Enviar logo
                </label>
                <input id="store-logo-upload" type="file" accept="image/*" className="hidden-file"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setLogoFile(f); }} />
              </div>
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input value={form.store_phone} onChange={(e) => set('store_phone', e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="form-field">
              <label>Endereço</label>
              <input value={form.store_address} onChange={(e) => set('store_address', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="panel form-section">
          <h3>Entrega</h3>
          <div className="admin-form-grid">
            <div className="form-field">
              <label>Taxa de entrega (R$)</label>
              <input type="number" step="0.01" min="0" value={form.delivery_fee} onChange={(e) => set('delivery_fee', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Pedido mínimo (R$)</label>
              <input type="number" step="0.01" min="0" value={form.min_order} onChange={(e) => set('min_order', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Tempo médio de entrega</label>
              <input value={form.avg_delivery_time} onChange={(e) => set('avg_delivery_time', e.target.value)} placeholder="30 - 50 min" />
            </div>
            <div className="form-field full">
              <label>Bairros atendidos (separados por vírgula)</label>
              <input value={form.delivery_neighborhoods} onChange={(e) => set('delivery_neighborhoods', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Chave Pix</label>
              <input value={form.pix_key} onChange={(e) => set('pix_key', e.target.value)} />
            </div>
            <div className="form-switches">
              <label className="switch">
                <input type="checkbox" checked={!!form.accept_delivery} onChange={(e) => set('accept_delivery', e.target.checked)} />
                <span className="switch-track"></span> Aceitar entregas
              </label>
              <label className="switch">
                <input type="checkbox" checked={!!form.accept_pickup} onChange={(e) => set('accept_pickup', e.target.checked)} />
                <span className="switch-track"></span> Aceitar retirada
              </label>
              <label className="switch">
                <input type="checkbox" checked={!!form.block_when_closed} onChange={(e) => set('block_when_closed', e.target.checked)} />
                <span className="switch-track"></span> Bloquear pedidos quando fechado
              </label>
            </div>
          </div>
        </div>

        <div className="panel form-section">
          <h3>WhatsApp</h3>
          <p className="muted-text">
            O token/credenciais ficam somente no servidor (variáveis de ambiente ou nesta tela,
            nunca no frontend).
          </p>
          <div className="admin-form-grid">
            <div className="form-field">
              <label>Número que recebe pedidos</label>
              <input value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', onlyDigits(e.target.value))} placeholder="5511999999999" />
            </div>
            <div className="form-field">
              <label>Provedor da API</label>
              <select value={form.whatsapp_provider} onChange={(e) => set('whatsapp_provider', e.target.value)}>
                {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <small className="muted">{PROVIDERS.find((p) => p.id === form.whatsapp_provider)?.desc}</small>
            </div>
            <div className="form-field">
              <label>URL da API (quando aplicável)</label>
              <input value={form.whatsapp_api_url} onChange={(e) => set('whatsapp_api_url', e.target.value)} placeholder="https://api.exemplo.com" />
            </div>
            <div className="form-field">
              <label>Token / credencial da API</label>
              <input type="password" value={form.whatsapp_api_token} onChange={(e) => set('whatsapp_api_token', e.target.value)} placeholder="Deixe em branco para manter o atual" />
            </div>
          </div>
        </div>

        <div className="panel form-section">
          <h3>Horário de funcionamento</h3>
          <div className="hours-grid">
            {hours.map((h, idx) => (
              <div className="hours-row" key={h.dayOfWeek}>
                <label className="switch">
                  <input type="checkbox" checked={!h.closed}
                    onChange={(e) => {
                      const next = [...hours];
                      next[idx] = { ...h, closed: !e.target.checked };
                      setHours(next);
                    }} />
                  <span className="switch-track"></span>
                  {h.name}
                </label>
                <input type="time" value={h.openTime}
                  disabled={h.closed}
                  onChange={(e) => {
                    const next = [...hours];
                    next[idx] = { ...h, openTime: e.target.value };
                    setHours(next);
                  }} />
                <span className="hours-sep">às</span>
                <input type="time" value={h.closeTime}
                  disabled={h.closed}
                  onChange={(e) => {
                    const next = [...hours];
                    next[idx] = { ...h, closeTime: e.target.value };
                    setHours(next);
                  }} />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            Salvar configurações
          </button>
        </div>
      </form>
    </div>
  );
}
