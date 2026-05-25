import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEMO_MODE } from '@/lib/demoMode';

const DEMO_EMAIL = 'admin@rawaes.local';
const DEMO_PASSWORD = '123456';

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signInEmail, setSignInEmail] = useState(DEMO_MODE ? DEMO_EMAIL : '');
  const [signInPassword, setSignInPassword] = useState(DEMO_MODE ? DEMO_PASSWORD : '');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    await signIn(signInEmail, signInPassword);
    setIsLoading(false);
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    await signUp(signUpEmail, signUpPassword, signUpFullName);
    setIsLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-gradient-primary" />
      <div className="absolute right-16 top-20 hidden text-[9rem] font-display leading-none text-white/[0.04] xl:block">روائس</div>

      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <span className="glass-pill w-fit text-xs text-muted-foreground">روائس - الحل اللوجستي الذكي</span>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight text-white">منصة تشغيل لوجستي عربية بعين تشغيلية واحدة.</h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                إدارة مناديب، أسطول سيارات، تنبيهات فورية، تقارير تشغيلية، واستعدادات GPS و AI داخل واجهة زجاجية موجهة للعمل اليومي.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">أداء المناديب اليومي</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">تحكم مركزي في الوثائق، حالات التشغيل، والتطبيقات النشطة.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">تحديثات فورية للمناديب</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">إشعارات لحظية ومركز عمليات جاهز للتتبع والتحليلات.</p>
            </div>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-xl overflow-hidden border-white/10 bg-white/[0.06]">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto logo-glow flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/18 text-2xl font-display text-primary">
              ر
            </div>
            <div>
              <CardTitle>روائس - الحل اللوجستي الذكي</CardTitle>
              <CardDescription>تسجيل الدخول أو إنشاء حساب للوصول إلى مركز العمليات</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/5">
                <TabsTrigger value="signin" className="gap-2 rounded-2xl">
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2 rounded-2xl">
                  <UserPlus className="h-4 w-4" />
                  إنشاء حساب
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4 text-right">
                  {DEMO_MODE ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                      الدخول التجريبي الجاهز: <span dir="ltr">{DEMO_EMAIL}</span> / <span dir="ltr">{DEMO_PASSWORD}</span>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">البريد الإلكتروني</Label>
                    <Input
                      id="signin-email"
                      type={DEMO_MODE ? 'text' : 'email'}
                      placeholder={DEMO_MODE ? 'admin أو admin@rawaes.local' : 'name@company.com'}
                      value={signInEmail}
                      onChange={(event) => setSignInEmail(event.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">كلمة المرور</Label>
                    <div className="relative">
                      <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="أدخل كلمة المرور" value={signInPassword} onChange={(event) => setSignInPassword(event.target.value)} required dir="ltr" />
                      <Button type="button" variant="ghost" size="sm" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword((previous) => !previous)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'جارٍ تسجيل الدخول...' : 'الدخول إلى المنصة'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4 text-right">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">الاسم الكامل</Label>
                    <Input id="signup-fullname" type="text" placeholder="الاسم كما سيظهر داخل المنصة" value={signUpFullName} onChange={(event) => setSignUpFullName(event.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                    <Input id="signup-email" type="email" placeholder="name@company.com" value={signUpEmail} onChange={(event) => setSignUpEmail(event.target.value)} required dir="ltr" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">كلمة المرور</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="8 أحرف على الأقل" value={signUpPassword} onChange={(event) => setSignUpPassword(event.target.value)} required minLength={8} dir="ltr" />
                      <Button type="button" variant="ghost" size="sm" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword((previous) => !previous)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب جديد'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
