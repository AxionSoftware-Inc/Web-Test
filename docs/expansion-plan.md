# QuestLab Expansion Plan

## Hozirgi Tayyor Pattern

Mathematics moduli birinchi to'liq vertical slice sifatida ishlaydi:

- landingdan subject sahifasiga o'tish
- subject hub
- daraja va test tanlash
- LaTeX test source
- parser orqali generated questions
- test session
- result review
- related tests

Bu pattern keyin Physics, Programming va boshqa fanlarga klonlanadi.

## Reusable Qatlamlar

### `features/assessment`

Hamma fanlar ishlatadigan test ishlash moduli.

Ichida:

- scoring
- answer normalization
- session UI
- question preview
- review list

### `features/test-generator`

LaTeX source, parser va test bank infratuzilmasi.

Keyin bu yerga qo'shiladi:

- LaTeX validation
- import/export
- creator draft flow
- AI-assisted generation

### `features/subjects/[subject]`

Har bir fan o'z hub sahifasi, subject content modeli va route mappingiga ega bo'ladi.

## Keyingi Modullarni Qo'shish Tartibi

1. `latex-test-bank.ts`ga yangi subject testlarini qo'shish.
2. `features/subjects/[subject]/model/[subject]-content.ts` yaratish.
3. `features/subjects/[subject]/ui/[subject]-page.tsx` yaratish.
4. `features/subjects/[subject]/ui/[subject]-test-page.tsx` yaratish.
5. `app/subjects/[subject]/page.tsx` route qo'shish.
6. `app/subjects/[subject]/tests/[testId]/page.tsx` route qo'shish.
7. Landing subject kartasiga `href` qo'shish.

## Yaqin Roadmap

### Phase 1

- Mathematics modulini polish qilish
- Assessment component APIlarini barqarorlashtirish
- Physics modulini shu pattern asosida qo'shish
- Programming modulini shu pattern asosida qo'shish

### Phase 2

- Subject hub komponentlarini ham umumiy qilish
- Test filteringni reusable component qilish
- User progress uchun local mock state qo'shish
- Session history saqlash

### Phase 3

- Backend persistence
- Auth
- Creator Studio
- Real question bank CRUD
- AI LaTeX-to-test generation

## Muhim Arxitektura Qoidasi

Fan modullari test session UI'ni o'zida qayta yozmasin. Ular `features/assessment` komponentlarini chaqiradi. Fan moduli faqat subject content, route, related tests va subject-specific copy uchun javob beradi.
