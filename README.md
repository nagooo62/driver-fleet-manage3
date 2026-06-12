# روائس اللوجستية — نظام إدارة المناديب والمركبات

منصة تشغيل لوجستي عربية (RTL) لإدارة مناديب التوصيل والأسطول عبر تطبيقات التوصيل
(ToYou، هنقرستيشن، جاهز، كيتا، The Chefz) — بواجهة Glassmorphism داكنة/فاتحة.

## المزايا الرئيسية

| الوحدة | الوصف |
|---|---|
| **لوحة القيادة** | مؤشرات حية، توزيع المناديب بالتطبيق، حالة الوثائق، رسوم Recharts |
| **المناديب** | تبويب لكل تطبيق + أرشيف، آيدي التطبيق واسم الحساب، فلاتر متقدمة، وثائق (8 أنواع) برفع ومعاينة |
| **تقارير المناديب Pro** | استيراد ملف الأداء Excel/CSV بكشف أعمدة ذكي، مطابقة الأسماء من دليل التشغيل، تارقت وبوديوم، أرشيف يومي قابل للبحث، تصدير Excel |
| **تقرير حالة التطبيقات** | شغالين/انتظار/متعطلين/أرشيف لكل تطبيق + تنبيهات اليوزرات الفعالة بدون طلبات |
| **تتبع GPS** | خريطة الأسطول + تدقيق GPS مقابل الطلبات مع تسعير الكيلومترات الزائدة |
| **الصلاحيات** | RBAC بأربعة أدوار + تعديل حي لصلاحيات الأدوار وتخصيص لمستخدم محدد |

## التقنيات

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Supabase · Recharts · SheetJS

## التشغيل

```bash
# المتطلبات: Node.js 18+
npm install

# انسخ ملف البيئة واملأ القيم
cp .env.example .env

npm run dev        # التطوير على http://localhost:8080
npm run build      # بناء الإنتاج
npm run test       # تشغيل الاختبارات (Vitest)
npm run lint       # فحص الكود
```

### متغيرات البيئة

| المتغير | الوصف |
|---|---|
| `VITE_SUPABASE_URL` | رابط مشروع Supabase |
| `VITE_SUPABASE_ANON_KEY` | المفتاح العام (anon) |
| `VITE_DEMO_MODE` | `true` = وضع تجريبي كامل بدون باكند (بيانات حقيقية من دليل التشغيل في localStorage) |

**الدخول التجريبي:** `admin@rawaes.local` / `123456`

## بنية المشروع

```
src/
├── pages/            # صفحات التطبيق (lazy-loaded)
├── components/
│   ├── layout/       # AppLayout, Topbar, SidebarNav
│   ├── dashboard/    # MetricCard وبطاقات المؤشرات
│   ├── reports/      # AppsStatusReport
│   ├── gps/          # GpsOrdersAudit
│   ├── settings/     # RolesPermissionsPanel
│   ├── branding/     # AnimatedLogo, BrandWatermark
│   └── ui/           # مكونات shadcn/ui
├── hooks/            # useDrivers, useCars, useAuth, useCountUp...
├── lib/              # rbac, permissionsStore, reportsArchive, demoMode
├── data/             # بيانات دليل التشغيل المستخرجة (JSON)
└── integrations/     # عميل Supabase والأنواع المولدة
```

## قاعدة البيانات

ملفات الهجرة في `supabase/migrations/` — تشمل جداول المناديب والسيارات والوثائق
مع سياسات RLS وحاويات التخزين (صور المناديب/السيارات/الوثائق).

## الاختبارات

اختبارات الوحدة تغطي منطق الأعمال الحرج (أرشيف التقارير، مخزن الصلاحيات):

```bash
npm run test
```
