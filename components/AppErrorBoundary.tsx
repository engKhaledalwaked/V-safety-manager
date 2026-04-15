import * as React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

const ErrorFallback: React.FC<FallbackProps> = (props: FallbackProps) => {
  const { error, resetErrorBoundary } = props;
  const errorMessage = error instanceof Error ? error.message : '';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-red-100 rounded-xl shadow-lg p-6 text-center">
        <h1 className="text-xl font-bold text-red-700 mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-gray-600 mb-4">
          تم إيقاف الصفحة لحماية الجلسة. يمكنك تحديث الصفحة والمحاولة مرة أخرى.
        </p>
        {errorMessage && (
          <p className="text-xs text-gray-500 bg-gray-100 rounded px-3 py-2 mb-4" dir="ltr">
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-white font-semibold hover:opacity-90"
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  );
};

const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = (props: AppErrorBoundaryProps) => {
  const { children } = props;
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error('Unhandled UI error:', error, info);
      }}
      onReset={() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
