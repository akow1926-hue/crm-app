import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  Bed, 
  Feather, 
  Sun, 
  Sofa, 
  DollarSign, 
  Tag 
} from 'lucide-react';
import { serviceCatalog as initialCatalog } from '../data/initialData';

export default function ServicesCatalogView() {
  const [catalog, setCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_service_catalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialCatalog;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdateItem = (id, field, value) => {
    setCatalog(prev => prev.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          [field]: field === 'price' ? (parseFloat(value) || 0) : value 
        };
      }
      return item;
    }));
  };

  const handleAddNewService = () => {
    const newId = `S-${Date.now().toString().slice(-4)}`;
    const newService = {
      id: newId,
      name: 'Новая услуга',
      category: 'Текстиль',
      unit: 'шт',
      price: 25000,
      icon: 'Sparkles'
    };
    setCatalog([...catalog, newService]);
  };

  const handleDeleteService = (id) => {
    if (window.confirm('Удалить эту услугу из прайс-листа?')) {
      setCatalog(catalog.filter(s => s.id !== id));
    }
  };

  const handleSaveCatalog = () => {
    localStorage.setItem('cosmo_crm_service_catalog', JSON.stringify(catalog));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    alert('✅ Прайс-лист и единица измерения для всех услуг сохранены! Курьер и цех теперь видят эти настройки.');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1.5px solid var(--accent-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Tag size={26} />
          </div>
          <div>
            <span className="badge badge-ready" style={{ fontSize: '11px', fontWeight: '800' }}>
              Админ-панель Управления Услугами
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
              ⚙️ Управление Услугами, Ценами и Единицами Измерения
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Здесь вы управляете услугами мойки ковров, курпачей, подушек, занавесок и мебели
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleAddNewService} 
            className="btn btn-secondary" 
            style={{ fontSize: '13px', background: 'rgba(255,255,255,0.06)' }}
          >
            <Plus size={16} /> Добавить Услугу
          </button>

          <button 
            onClick={handleSaveCatalog} 
            className="btn btn-primary" 
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontSize: '13.5px', fontWeight: '800' }}
          >
            <CheckCircle2 size={16} /> {savedSuccess ? '✓ Сохранено' : 'Сохранить Изменения'}
          </button>
        </div>
      </div>

      {/* Services Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {catalog.map((svc, index) => (
          <div 
            key={svc.id} 
            className="glass-card"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 17, 40, 0.98) 100%)',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              borderLeft: '5px solid #6366f1',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                Позиция #{index + 1} ({svc.id})
              </span>

              <button 
                onClick={() => handleDeleteService(svc.id)}
                className="btn-icon"
                title="Удалить услугу"
              >
                <Trash2 size={15} color="#f43f5e" />
              </button>
            </div>

            {/* Service Name */}
            <div className="input-group">
              <label className="input-label">Название услуги *</label>
              <input 
                type="text"
                required
                value={svc.name}
                onChange={(e) => handleUpdateItem(svc.id, 'name', e.target.value)}
                className="input-field"
                placeholder="Например: Мойка курпачи"
                style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}
              />
            </div>

            {/* Unit & Price Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group">
                <label className="input-label" style={{ color: '#38bdf8' }}>Единица измерения *</label>
                <select 
                  value={svc.unit}
                  onChange={(e) => handleUpdateItem(svc.id, 'unit', e.target.value)}
                  className="select-field"
                  style={{ fontSize: '13px', fontWeight: '700', borderColor: '#38bdf8' }}
                >
                  <option value="м²">м² (кв. метры)</option>
                  <option value="метр">метр (погонный)</option>
                  <option value="шт">шт (штука)</option>
                  <option value="комплект">комплект</option>
                  <option value="место">посадочное место</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: '#10b981' }}>Цена за 1 {svc.unit} *</label>
                <input 
                  type="number"
                  required
                  value={svc.price}
                  onChange={(e) => handleUpdateItem(svc.id, 'price', e.target.value)}
                  className="input-field"
                  style={{ fontSize: '14px', fontWeight: '800', color: '#10b981', borderColor: '#10b981' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '8px' }}>
              💡 <strong>Пример:</strong> Курьер выбирает «{svc.name}», система запрашивает количество в <strong>{svc.unit}</strong> по ставке <strong>{(svc.price || 0).toLocaleString()} сум/{svc.unit}</strong>.
            </div>
          </div>
        ))}
      </div>

      {/* Save Button Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <button 
          onClick={handleSaveCatalog} 
          className="btn btn-primary" 
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '14px 28px', fontSize: '15px', fontWeight: '900', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)' }}
        >
          <CheckCircle2 size={20} /> Сохранить изменения прайс-листа для всей CRM
        </button>
      </div>
    </div>
  );
}
