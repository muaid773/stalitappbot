# Dish Align

تطبيق أندرويد عربي يساعد المستخدم على ضبط طبق الأقمار الصناعية باستخدام
الموقع الجغرافي، الحساسات، والبوصلة عند توفرها.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dish-aligner` — تطبيق Expo المحمول.
- `artifacts/dish-aligner/app/(tabs)/index.tsx` — أدوات القياس والحساسات.
- `artifacts/dish-aligner/app/(tabs)/align.tsx` — تحديد الموقع، اختيار القمر، والحسابات.
- `fastapi-sync` — خادم FastAPI اختياري لاستقبال مزامنة جهات الاتصال يدويًا.
- `.github/workflows/build-apk.yml` — بناء APK عبر GitHub Actions.

## Architecture decisions

- الحسابات الفلكية تتم محليًا على الجهاز ولا تحتاج إلى اتصال بالخادم.
- الموقع وجهات الاتصال لا يقرآن إلا بعد موافقة المستخدم، ومزامنة جهات الاتصال
  يدوية وصريحة وليست عملية خلفية.
- خادم FastAPI لا يحفظ جهات الاتصال؛ يطبع الطلب ويعيد العدد المستلم فقط.

## Product

- قراءة الميلان الرأسي والجانبي من مقياس التسارع.
- قراءة البوصلة عند توفر مستشعر المغناطيسية.
- اختيار الموقع تلقائيًا أو إدخال الإحداثيات يدويًا.
- حساب اتجاه الطبق وارتفاعه وميلان LNB لعدة أقمار معروفة.
- مزامنة جهات الاتصال اختيارية عبر عنوان خادم يدخله المستخدم.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
