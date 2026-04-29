# QuestLab Project Overview

## Qisqa Ta'rif

QuestLab - programming, matematika, fizika, logic va boshqa texnik sohalar uchun global test, practice va learning platforma. Platforma Brilliant, LeetCode, Khan Academy, Codeforces va shunga o'xshash kuchli mahsulotlarning eng foydali tomonlarini birlashtiradi, lekin asosiy yangiligi adaptive skill graph va modular assessment engine bo'ladi.

## Asosiy Maqsad

Foydalanuvchi faqat savol yechib ketmaydi. Har bir javob, xato, hint ishlatish, yechish vaqti va qayta urinish learning graphga ta'sir qiladi. Platforma keyingi eng foydali qadamni tanlaydi: lesson, problem, lab, coding task yoki review drill.

## Hozirgi Bosqich

Hozir web platformaning boshlang'ich Next.js loyihasi yaratildi. Landing page komponentlarga ajratilgan va platforma keyinchalik monolit bo'lib qolmasligi uchun feature-based arxitektura qo'yildi.

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

## Arxitektura Yo'nalishi

Kod feature-based modular arxitektura bilan yuradi:

```txt
src/
  app/
  features/
  entities/
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

### `entities`

Platformadagi asosiy domen obyektlari:

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

1. `entities` papkasini ochish va asosiy domain typelarni yozish.
2. `features/subjects` modulini yaratish.
3. `features/problems` modulini yaratish.
4. `features/practice` modulini yaratish.
5. Public route skeletonlarini qo'yish.
6. Learner dashboard skeletonini qo'yish.
7. Seed data bilan birinchi real UI oqimini qurish.
8. Keyin backend persistence va auth qo'shish.

## Muhim Qoidalar

- `app` ichida katta komponent yoki biznes logika to'planmasin.
- Har yangi mahsulot qismi `features` ichida alohida modul bo'lsin.
- Domen obyektlari `entities` ichida saqlansin.
- Umumiy komponentlar `shared/ui`da bo'lsin.
- Data validation uchun Zod ishlatilsin.
- Forms uchun React Hook Form ishlatilsin.
- Icon kerak bo'lsa `lucide-react` ishlatilsin.
