# QuestLab Project Overview

## Qisqa Ta'rif

QuestLab - programming, matematika, fizika, logic va boshqa texnik sohalar uchun global test, practice va learning platforma. Platforma Brilliant, LeetCode, Khan Academy, Codeforces va shunga o'xshash kuchli mahsulotlarning eng foydali tomonlarini birlashtiradi, lekin asosiy yangiligi adaptive skill graph va modular assessment engine bo'ladi.

## Asosiy Maqsad

Foydalanuvchi faqat savol yechib ketmaydi. Har bir javob, xato, hint ishlatish, yechish vaqti va qayta urinish learning graphga ta'sir qiladi. Platforma keyingi eng foydali qadamni tanlaydi: lesson, problem, lab, coding task yoki review drill.

## Hozirgi Bosqich

Hozir web platforma ishlaydigan frontend-backend vertical slice bosqichida. Landing page komponentlarga ajratilgan, test/session flow PostgreSQL-ready Django API bilan ulangan va keyingi o'sish uchun feature-based arxitektura qo'yilgan.

Hozir mavjud asosiy qismlar:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Landing page
- Landing content modeli
- Shared UI primitives
- Shared config
- Shared utility helper
- Product site map
- Django REST API with versioned `/api/v1/` contract
- Server scoring, immutable result snapshots, analytics and audit events

## Arxitektura Yo'nalishi

Kod feature-based modular arxitektura bilan yuradi:

```txt
src/
  app/
  features/
  entities/ (planned shared domain boundary)
  shared/
```

### `app`

Next.js route entrypointlari. Bu papkada katta biznes logika yozilmaydi. Route fayllar feature komponentlarini chaqiradi.

### `features`

Mahsulot modullari shu yerda bo'ladi. Masalan:

- `landing`
- `dashboard`
- `subjects`
- `problems`
- `practice`
- `code-arena`
- `labs`
- `creator-studio`
- `organization`

Har feature o'zining `ui`, `model`, `lib`, `api` qismlariga ega bo'lishi mumkin.

### `entities` (planned extraction boundary)

Platformadagi asosiy domen obyektlari shu qatlamga chiqariladi. Hozirgi vertical slice'da ularning transport turlari `src/shared/api`, feature modellari esa tegishli feature papkalarida turibdi:

- user
- subject
- skill
- problem
- attempt
- session
- course
- lab

### `shared`

Hamma featurelar ishlatadigan umumiy kod:

- UI primitives
- config
- utility functions
- common types
- constants

## O'rnatilgan Kutubxonalar

### UI va Styling

- `lucide-react` - iconlar uchun
- `clsx` - conditional className yig'ish uchun
- `tailwind-merge` - Tailwind class conflictlarini to'g'ri merge qilish uchun
- `class-variance-authority` - reusable component variantlari uchun

### Forms va Validation

- `zod` - schema validation uchun
- `react-hook-form` - form state boshqarish uchun
- `@hookform/resolvers` - form validationni Zod bilan ulash uchun

## Landing Page Tarkibi

Landing page quyidagi sectionlardan iborat:

- Header
- Hero
- Subject map
- Product modules
- Learning loop
- Platform surfaces
- Architecture direction
- Roadmap
- CTA

Har bir section alohida komponent sifatida joylashgan:

```txt
src/features/landing/ui/
```

Landing matnlari va takroriy data:

```txt
src/features/landing/model/landing-content.ts
```

## Keyingi Ish Tartibi

1. Canonical API/schema va scoring contractini barcha yangi modullarga qo'llash.
2. `learning` backend app'ini content, assessment, classroom, organization va import bounded contextlariga ajratish.
3. `entities` papkasini API turlari va domen mapperlari uchun bosqichma-bosqich ochish.
4. Topic graph, mastery policy va evidence eventlarini server-owned, versioned modelga ko'chirish.
5. Physics, Programming va keyingi fanlarni mathematics vertical slice patterni bilan qo'shish.
6. Auth/RBAC va production authorizationni alohida security workstream sifatida yakunlash.

## Muhim Qoidalar

- `app` ichida katta komponent yoki biznes logika to'planmasin.
- Har yangi mahsulot qismi `features` ichida alohida modul bo'lsin.
- Domen obyektlari `entities` ichida saqlansin.
- Umumiy komponentlar `shared/ui`da bo'lsin.
- Data validation uchun Zod ishlatilsin.
- Forms uchun React Hook Form ishlatilsin.
- Icon kerak bo'lsa `lucide-react` ishlatilsin.
