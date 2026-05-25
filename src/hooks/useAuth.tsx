import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  createDemoSession,
  createDemoUser,
  DEMO_MODE,
  getDemoUser,
  setDemoUser,
} from '@/lib/demoMode';

type AuthResult = Promise<{ error: Error | null }>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => AuthResult;
  signIn: (email: string, password: string) => AuthResult;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (DEMO_MODE) {
      const demoUser = getDemoUser();
      setUser(demoUser);
      setSession(demoUser ? createDemoSession(demoUser) : null);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (DEMO_MODE) {
      const demoUser = createDemoUser(email, fullName);
      setDemoUser(demoUser);
      setUser(demoUser);
      setSession(createDemoSession(demoUser));
      toast({
        title: 'تم تفعيل الوضع التجريبي',
        description: 'تم إنشاء جلسة محلية للتجربة بدون الاعتماد على مشروع Supabase الحالي.',
      });
      return { error: null };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          title: 'خطأ في التسجيل',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب',
        });
      }

      return { error };
    } catch (error: unknown) {
      const authError = error instanceof Error ? error : new Error('Unexpected signup error');
      toast({
        title: 'خطأ في التسجيل',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      const normalizedEmail = (() => {
        const value = email.trim().toLowerCase();
        if (!value || value === 'admin') return 'admin@rawaes.local';
        return value;
      })();
      const fullName = normalizedEmail === 'admin@rawaes.local'
        ? 'مدير تجريبي'
        : normalizedEmail.split('@')[0] || 'مستخدم تجريبي';
      const demoUser = createDemoUser(normalizedEmail, fullName);
      setDemoUser(demoUser);
      setUser(demoUser);
      setSession(createDemoSession(demoUser));
      toast({
        title: 'تم الدخول للوضع التجريبي',
        description: 'أصبحت قادرًا على تجربة الصفحات محليًا بدون الاتصال بالباكند الحالي.',
      });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: error.message.includes('Invalid login credentials')
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'مرحبًا بك',
          description: 'تم تسجيل الدخول بنجاح',
        });
      }

      return { error };
    } catch (error: unknown) {
      const authError = error instanceof Error ? error : new Error('Unexpected sign-in error');
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      return { error: authError };
    }
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      setDemoUser(null);
      setUser(null);
      setSession(null);
      toast({
        title: 'تم تسجيل الخروج',
        description: 'يمكنك العودة إلى شاشة الدخول التجريبية في أي وقت.',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: 'خطأ في تسجيل الخروج',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تم تسجيل الخروج بنجاح',
          description: 'إلى اللقاء',
        });
      }
    } catch {
      toast({
        title: 'خطأ في تسجيل الخروج',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
