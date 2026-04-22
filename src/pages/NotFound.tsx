import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-semibold text-white">404</h1>
        <p className="mt-3 text-lg text-white">المسار المطلوب غير موجود</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          يبدو أنك وصلت إلى وجهة غير مرتبطة داخل منصة روائس. يمكنك العودة إلى لوحة القيادة ومتابعة العمل.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link to="/dashboard">العودة إلى لوحة القيادة</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
