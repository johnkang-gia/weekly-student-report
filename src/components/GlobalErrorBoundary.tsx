import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <AlertCircle size={64} style={{ color: '#EF4444', margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginBottom: '1rem' }}>
          시스템 오류가 발생했습니다
        </h2>
        <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: 1.6 }}>
          서비스 이용에 불편을 드려 죄송합니다.<br/>
          해당 오류 내역은 시스템 관리자에게 즉시 자동 보고되었습니다.<br/>
          아래 버튼을 눌러 화면을 새로고침 해주세요.
        </p>
        <button 
          onClick={resetErrorBoundary}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
        >
          <RefreshCw size={20} />
          다시 시도하기
        </button>
      </div>
    </div>
  );
};

export const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Automatically send error to Sentry
        Sentry.captureException(error, { extra: info });
        console.error("Caught by Global Error Boundary:", error, info);
      }}
      onReset={() => {
        window.location.href = '/';
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
