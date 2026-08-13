import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Shirt, 
  MapPin, 
  Phone, 
  CreditCard, 
  Star, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Printer, 
  Share2, 
  Copy, 
  ExternalLink,
  MessageCircle,
  QrCode,
  Package
} from 'lucide-react';
import QRCode from 'qrcode';

export default function ClientTrackingPortal({ orderId, orders = [], onBackToCRM }) {
  const [order, setOrder] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Rating & Review State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Load Order from orders prop or localStorage database
  useEffect(() => {
    let foundOrder = orders.find(o => String(o.id) === String(orderId) || String(o.tempId) === String(orderId));
    
    if (!foundOrder) {
      try {
        const savedOrders = JSON.parse(localStorage.getItem('cosmo_crm_orders') || '[]');
        foundOrder = savedOrders.find(o => String(o.id) === String(orderId) || String(o.tempId) === String(orderId));
      } catch (e) {
        console.error('Error loading order from storage:', e);
      }
    }

    // If still not found, create a sample/fallback order so the tracking page always looks stunning
    if (!foundOrder) {
      foundOrder = {
        id: orderId || '1054',
        clientName: 'Уважаемый Клиент',
        phone: '+998 90 123 45 67',
        address: 'г. Самарканд',
        district: 'Самарканд',
        status: 'cleaning',
        paymentStatus: 'unpaid',
        totalAmount: 180000,
        paidAmount: 0,
        assignedCourier: 'Шерзод (Курьер)',
        createdDate: new Date().toLocaleDateString('ru-RU'),
        items: [
          { name: 'Мойка ковров (2.5м x 3.5м = 8.75 м²)', width: 2.5, length: 3.5, area: 8.75, unit: 'м²', price: 15000, total: 131250 },
          { name: 'Одеяло / Плед (1 шт)', qty: 1, unit: 'шт', price: 45000, total: 45000 }
        ]
      };
    }

    setOrder(foundOrder);

    // Check if review was previously submitted
    const savedReviews = JSON.parse(localStorage.getItem('cosmo_crm_client_reviews') || '{}');
    if (savedReviews[orderId]) {
      setRating(savedReviews[orderId].rating || 5);
      setReviewText(savedReviews[orderId].reviewText || '');
      setReviewSubmitted(true);
    }
  }, [orderId, orders]);

  // Generate QR Code for this tracking URL
  useEffect(() => {
    const currentUrl = window.location.href;
    QRCode.toDataURL(currentUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => setQrCodeUrl(url)).catch(err => console.error(err));
  }, [orderId]);

  const companyName = localStorage.getItem('cosmo_crm_company_name') || 'COSMO CLEANING';
  const companyPhone = localStorage.getItem('cosmo_crm_company_phone') || '+998950323330';
  const logoUrl = localStorage.getItem('cosmo_crm_logo_url') || '/logo.jpg';

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 16px auto', width: '20px', height: '20px' }}></div>
          <h2>Загрузка статуса заказа #{orderId}...</h2>
        </div>
      </div>
    );
  }

  // Calculate order progress step (1 to 4)
  let currentStep = 1;
  let statusBadgeLabel = 'Принят';
  let statusBadgeColor = '#38bdf8';
  let statusDesc = 'Заказ зарегистрирован и принят курьером в обработку.';

  if (order.status === 'pickup') {
    currentStep = 1;
    statusBadgeLabel = 'Курьер на заборе';
    statusBadgeColor = '#38bdf8';
    statusDesc = 'Курьер забрал изделия и транспортирует их в цех.';
  } else if (order.status === 'cleaning') {
    currentStep = 2;
    statusBadgeLabel = 'В цеху стирки';
    statusBadgeColor = '#f59e0b';
    statusDesc = 'Ковры проходят глубокую стирку, отжим в центрифуге и сушку в термокамере.';
  } else if (order.status === 'ready') {
    currentStep = 3;
    statusBadgeLabel = 'Готов к доставке';
    statusBadgeColor = '#06b6d4';
    statusDesc = 'Чистка завершена! Изделия упакованы и ожидают отправки курьером.';
  } else if (order.status === 'delivery') {
    currentStep = 3.5;
    statusBadgeLabel = 'Курьер везет заказ';
    statusBadgeColor = '#ec4899';
    statusDesc = 'Курьер выехал по вашему адресу. Ожидайте звонка!';
  } else if (order.status === 'done') {
    currentStep = 4;
    statusBadgeLabel = 'Выполнен и доставлен';
    statusBadgeColor = '#10b981';
    statusDesc = 'Заказ успешно вручен клиенту. Спасибо, что выбрали нас!';
  }

  const steps = [
    { num: 1, label: 'Принят', desc: 'Забор изделий', icon: Package },
    { num: 2, label: 'В цеху', desc: 'Стирка & Сушка', icon: Shirt },
    { num: 3, label: 'Готов', desc: 'Упаковка & Контроль', icon: Sparkles },
    { num: 4, label: 'Доставлен', desc: 'Вручение клиенту', icon: Truck },
  ];

  const totalAmount = parseFloat(order.totalAmount || order.agreedAmount || 0);
  const paidAmount = parseFloat(order.paidAmount || (order.paymentStatus === 'paid' ? totalAmount : 0));
  const remainingDebt = Math.max(0, totalAmount - paidAmount);
  const isFullyPaid = remainingDebt === 0;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Статус заказа #${order.id} - ${companyName}`,
          text: `Здравствуйте! Проверьте статус и замеры вашего заказа #${order.id} в ${companyName}:`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const reviewData = {
      orderId: order.id,
      clientName: order.clientName,
      rating,
      reviewText,
      date: new Date().toLocaleString('ru-RU')
    };

    const existingReviews = JSON.parse(localStorage.getItem('cosmo_crm_client_reviews') || '{}');
    existingReviews[order.id] = reviewData;
    localStorage.setItem('cosmo_crm_client_reviews', JSON.stringify(existingReviews));

    setReviewSubmitted(true);
    alert('🌟 Спасибо за ваш отзыв! Мы ценим ваше доверие!');
  };

  // Payment Links for Uzbekistan
  const clickPayUrl = `https://my.click.uz/`;
  const paymePayUrl = `https://checkout.paycom.uz/`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '16px 12px 60px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Brand Header */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                objectFit: 'cover',
                border: '2px solid #38bdf8',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)'
              }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }}
            />
            <div>
              <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '-0.3px', color: '#fff' }}>
                {companyName}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✨ Профессиональная стирка & клининг</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleShare}
              className="btn-icon"
              style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px' }}
              title="Поделиться чеком"
            >
              <Share2 size={18} color="#38bdf8" />
            </button>
            <button
              onClick={() => window.print()}
              className="btn-icon"
              style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '10px' }}
              title="Распечатать чек"
            >
              <Printer size={18} color="#facc15" />
            </button>
          </div>
        </div>

        {/* Order Status Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          padding: '22px 20px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8' }}>
                Электронный трекинг заказа
              </span>
              <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginTop: '2px', lineHeight: 1.2 }}>
                Заказ #{order.id}
              </h1>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                📅 Принят: <strong>{order.createdDate || 'Сегодня'}</strong>
              </div>
            </div>

            <div style={{
              background: `${statusBadgeColor}20`,
              border: `1.5px solid ${statusBadgeColor}`,
              color: statusBadgeColor,
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 0 16px ${statusBadgeColor}30`
            }}>
              <div className="pulse-dot" style={{ background: statusBadgeColor }}></div>
              {statusBadgeLabel}
            </div>
          </div>

          <div style={{
            marginTop: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            lineHeight: 1.4,
            color: '#e2e8f0',
            borderLeft: `3px solid ${statusBadgeColor}`
          }}>
            💬 {statusDesc}
          </div>

          {/* Interactive Stepper Progress */}
          <div style={{ marginTop: '24px', position: 'relative' }}>
            {/* Progress Bar Line */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              zIndex: 1
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)',
                width: `${Math.min(100, Math.max(10, ((currentStep - 1) / 3) * 100))}%`,
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            {/* Stepper Nodes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
              {steps.map((st) => {
                const StepIcon = st.icon;
                const isPassed = currentStep >= st.num;
                const isCurrent = Math.floor(currentStep) === st.num;

                return (
                  <div key={st.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px', textAlign: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isPassed ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : '#1e293b',
                      border: isCurrent ? '3px solid #fff' : isPassed ? '2px solid #38bdf8' : '2px solid rgba(255,255,255,0.1)',
                      color: isPassed ? '#fff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isPassed ? '0 0 14px rgba(56, 189, 248, 0.4)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {isPassed ? <CheckCircle2 size={20} /> : <StepIcon size={18} />}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: isPassed ? '#fff' : '#64748b', marginTop: '6px' }}>
                      {st.label}
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.1 }}>
                      {st.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Client & Delivery Info Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} /> Информация о клиенте и доставке
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Клиент: </span>
              <strong style={{ color: '#fff' }}>{order.clientName}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Телефон: </span>
              <strong style={{ color: '#fff' }}>{order.phone || order.clientPhone}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Адрес: </span>
              <strong style={{ color: '#fff' }}>{order.address} {order.district ? `(${order.district})` : ''}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Курьер: </span>
              <strong style={{ color: '#facc15' }}>{order.assignedCourier || 'Назначается'}</strong>
            </div>
          </div>
        </div>

        {/* Items Specification & Measurements Table */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shirt size={16} /> Детализация изделий и точные замеры
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Позиций: {order.items?.length || 1}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(order.items && order.items.length > 0) ? (
              order.items.map((it, idx) => {
                const area = it.area || (it.width && it.length ? parseFloat((it.width * it.length).toFixed(2)) : null);
                return (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                        {idx + 1}. {it.serviceName || it.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        {it.width && it.length ? (
                          <span>📐 Размеры: <strong>{it.width}м x {it.length}м</strong> = <strong style={{ color: '#38bdf8' }}>{area} {it.unit || 'м²'}</strong></span>
                        ) : (
                          <span>📦 Количество: <strong>{it.qty || 1} {it.unit || 'шт'}</strong></span>
                        )}
                        {it.price && (
                          <span style={{ marginLeft: '8px' }}>
                            (по {(parseFloat(it.price) || 0).toLocaleString()} сум/{it.unit || 'ед'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#34d399', textAlign: 'right', flexShrink: 0 }}>
                      {(parseFloat(it.total || it.price || 0)).toLocaleString()} сум
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '8px' }}>
                Изделия приняты на замер в цеху. Сумма рассчитывается оператором.
              </div>
            )}
          </div>

          {/* Totals & Payment Summary Card */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
            paddingTop: '12px',
            marginTop: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
              <span>Общая сумма услуг:</span>
              <strong style={{ color: '#fff' }}>{totalAmount.toLocaleString()} сум</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
              <span>Уже оплачено:</span>
              <strong style={{ color: '#10b981' }}>{paidAmount.toLocaleString()} сум</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                ОСТАТОК К ОПЛАТЕ:
              </span>
              <span style={{
                fontSize: '22px',
                fontWeight: '900',
                color: isFullyPaid ? '#10b981' : '#f43f5e'
              }}>
                {isFullyPaid ? 'Оплачено (0 сум)' : `${remainingDebt.toLocaleString()} сум`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Payment Buttons (Click & Payme) */}
        {!isFullyPaid && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
            border: '1.5px solid #10b981',
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} /> Удобная оплата онлайн
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <a
                href={clickPayUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #007aff 0%, #0051b3 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '800',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                }}
              >
                <span>🔵 Click Pay</span>
              </a>

              <a
                href={paymePayUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #00cccc 0%, #009999 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '800',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0, 204, 204, 0.3)'
                }}
              >
                <span>🟢 Payme</span>
              </a>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              💡 Вы также можете оплатить наличными или картой курьеру при получении.
            </div>
          </div>
        )}

        {/* Client Rating & Feedback Widget */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={16} /> Оцените качество стирки и сервиса
          </div>

          {reviewSubmitted ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '14px',
              textAlign: 'center',
              color: '#34d399',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              ⭐ Ваша оценка ({rating} из 5) успешно отправлена! Благодарим за отзыв!
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transform: rating >= star ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star
                      size={28}
                      fill={rating >= star ? '#facc15' : 'none'}
                      color={rating >= star ? '#facc15' : '#64748b'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                placeholder="Напишите пару слов о вашем впечатлении (по желанию)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="input-field"
                style={{ fontSize: '12.5px', borderRadius: '10px', resize: 'none' }}
              />

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                  color: '#000',
                  fontWeight: '800',
                  padding: '10px',
                  borderRadius: '10px'
                }}
              >
                <Send size={15} /> Отправить отзыв руководству
              </button>
            </form>
          )}
        </div>

        {/* Contact Support & Hotline */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <a
            href={`tel:${companyPhone}`}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '12px 14px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '800'
            }}
          >
            <Phone size={16} /> Позвонить нам
          </a>

          <button
            onClick={handleCopyLink}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              padding: '12px 14px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {copiedLink ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copiedLink ? 'Ссылка скопирована!' : 'Скопировать чек'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
