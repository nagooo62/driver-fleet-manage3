import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Application error boundary caught an error:', error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-semibold text-white">حدث خطأ غير متوقع</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            تم احتواء الخطأ داخل الواجهة حتى لا تتوقف المنصة بالكامل. يمكنك إعادة تحميل الصفحة ومتابعة العمل.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              إعادة تحميل المنصة
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
