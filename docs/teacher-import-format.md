# O‘qituvchi uchun test import formati

QuestLab’da test qo‘shish uchun texnik JSON formatini yodlash shart emas. `/crud` sahifasidagi **Tayyor matnni qo‘ying** oynasiga Word, Telegram yoki AI’dan olingan matnni joylash kifoya.

## Oddiy matn

```text
Test: Integral asoslari
Fan: Matematika
Bo‘lim: Integral

1. ∫ x dx = ?
A) x² + C
B) x²/2 + C
C) 2x + C
D) x + C
Javob: B
Izoh: Daraja birga oshiriladi va yangi darajaga bo‘linadi.
```

Qoidalar:

- Savol raqami `1.`, `1)` yoki `Savol 1:` ko‘rinishida bo‘lishi mumkin.
- Variantlar `A)`, `B.`, `C:` kabi yozilishi mumkin.
- To‘g‘ri javobni `Javob: B` yoki `Answer: B` bilan ko‘rsating.
- Variant bo‘lmasa, savol short-answer sifatida saqlanadi.
- `Izoh:` va `Skill:` qatorlari ixtiyoriy.

## CSV

Bir qatorda bitta savol bo‘ladi:

```csv
question,A,B,C,D,answer,explanation,skills
"2 + 2 nechaga teng?",3,4,5,,B,"To‘rt bo‘ladi.",addition
```

CSV importdan keyin barcha savollar preview’da ko‘rsatiladi. Javob harfini bosib o‘zgartirish, savol yoki variant matnini shu oynada tuzatish mumkin.

## Saqlash

`Bazaga saqlash` bosilganda:

- bitta test yopiq test bazasiga saqlanadi;
- JSON ichida bir nechta test bo‘lsa, ular bitta yangi yopiq bazaga birlashtiriladi;
- bo‘lim va fan tanlangan qiymatga moslanadi;
- skill ko‘rsatilmagan savollarga `general` skill avtomatik beriladi;
- bo‘sh savol, javobsiz test yoki ikkidan kam variantli savol saqlashdan oldin ko‘rsatiladi.

Texnik JSON va mavjud testlarni packga yig‘ish uchun **Ko‘p testli baza** sahifasidagi kengaytirilgan import oynasidan foydalanish mumkin.
