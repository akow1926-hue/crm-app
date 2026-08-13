import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught runtime error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '16px',
            padding: '32px 24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e'
            }}>
              <ShieldAlert size={32} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              Небольшая задержка приложения
            </h2>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              При отображении произошла временная ошибка. Данные в безопасности и сохранены в базе Spacebase.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '11px',
                color: '#f87171',
                fontFamily: 'monospace',
                maxWidth: '100%',
                maxHeight: '200px',
                overflowY: 'auto',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}>
                  {String(this.state.error.message || this.state.error)}
                </div>
                {this.state.error.stack && <div>{this.state.error.stack}</div>}
                {this.state.errorInfo?.componentStack && (
                  <div style={{ marginTop: '8px', color: '#94a3b8' }}>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', marginTop: '8px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)'
                }}
              >
                <RefreshCw size={16} /> Перезагрузить страницу
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('cosmo_crm_user');
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Сбросить сессию и войти
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
