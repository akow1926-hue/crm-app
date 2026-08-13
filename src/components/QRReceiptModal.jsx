import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Send, 
  Printer, 
  Share2, 
  ExternalLink,
  Smartphone,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { sendSMSNotification } from '../services/smsService';

export default function QRReceiptModal({ order, onClose }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSentSuccess, setSmsSentSuccess] = useState(false);

  if (!order) return null;

  // Build the tracking URL
  const trackingUrl = `${window.location.origin}${window.location.pathname}?track=${order.id || order.tempId || '1054'}`;
  const companyName = localStorage.getItem('cosmo_crm_company_name') || 'COSMO CLEANING';

  useEffect(() => {
    QRCode.toDataURL(trackingUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => setQrCodeDataUrl(url)).catch(err => console.error('QR code error:', err));
  }, [trackingUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendSMS = async () => {
    if (!order.phone && !order.clientPhone) {
      alert('У этого заказа не указан номер телефона клиента!');
      return;
    }

    setIsSendingSms(true);
    const smsText = `Assalomu alaykum, ${order.clientName || 'hurmatli mijoz'}!\nSizning #${order.id} buyurtmangiz holati va cheki:\n${trackingUrl}\n${companyName}`;

    try {
      const res = await sendSMSNotification({
        phone: order.phone || order.clientPhone,
        text: smsText
      });

      setIsSendingSms(false);
      if (res.success) {
        setSmsSentSuccess(true);
        setTimeout(() => setSmsSentSuccess(false), 4000);
        alert(`✅ SMS со ссылкой на чек успешно отправлено клиенту (${order.phone || order.clientPhone})!`);
      } else {
        alert(`Ошибка отправки SMS: ${res.message || 'Проверьте баланс Eskiz'}`);
      }
    } catch (e) {
      setIsSendingSms(false);
      alert('Ошибка при отправке SMS: ' + e.message);
    }
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`Здравствуйте, ${order.clientName}!\nЭлектронный чек и статус вашего заказа #${order.id} в ${companyName}:\n${trackingUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(trackingUrl)}&text=${text}`, '_blank');
  };

  const handleOpenPublicView = () => {
    window.open(trackingUrl, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div 
        className="glass-card animate-fade-in" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 26, 0.99) 100%)',
          border: '1.5px solid #38bdf8',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>
                QR-Чек и Трекинг Заказа #{order.id}
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Клиент: <strong>{order.clientName}</strong>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* QR Code Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          background: '#ffffff',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code" 
              style={{ width: '190px', height: '190px', borderRadius: '8px' }} 
            />
          ) : (
            <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Генерация QR...
            </div>
          )}

          <div style={{ textAlign: 'center', color: '#0f172a' }}>
            <div style={{ fontSize: '12px', fontWeight: '800' }}>
              Наведите камеру смартфона для просмотра чека
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
              Статус стирки, точные размеры, остаток долга и оплата
            </div>
          </div>
        </div>

        {/* Tracking Link Input */}
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label" style={{ fontSize: '11px', color: '#38bdf8' }}>Прямая ссылка для клиента:</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              readOnly 
              value={trackingUrl} 
              className="input-field" 
              style={{ fontSize: '11.5px', padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button 
              onClick={handleCopyLink} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', flexShrink: 0, fontSize: '12px', fontWeight: '700' }}
            >
              {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* SMS Button */}
          <button
            onClick={handleSendSMS}
            disabled={isSendingSms}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: '800',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
            }}
          >
            <Smartphone size={16} /> 
            {isSendingSms ? 'Отправка СМС...' : `📱 Отправить SMS с чеком (${order.phone || order.clientPhone || 'Клиенту'})`}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Telegram Share */}
            <button
              onClick={handleShareTelegram}
              className="btn btn-secondary"
              style={{
                background: 'rgba(0, 136, 204, 0.15)',
                borderColor: '#0088cc',
                color: '#38bdf8',
                padding: '10px',
                fontSize: '12.5px',
                fontWeight: '700'
              }}
            >
              <Send size={15} /> В Telegram
            </button>

            {/* Public Page Preview */}
            <button
              onClick={handleOpenPublicView}
              className="btn btn-secondary"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                borderColor: '#38bdf8',
                color: '#fff',
                padding: '10px',
                fontSize: '12.5px',
                fontWeight: '700'
              }}
            >
              <ExternalLink size={15} /> Открыть чек
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
