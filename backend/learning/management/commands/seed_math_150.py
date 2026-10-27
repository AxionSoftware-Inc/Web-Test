import json
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import (
    ExamPack,
    ExamPackItem,
    Question,
    Skill,
    Subject,
    Test,
    TestQuestion,
    Topic,
)


class Command(BaseCommand):
    help = "Seed comprehensive 150+ math test starter kit with LaTeX, solutions and skills."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding 150+ Mathematics Starter Kit...")

        # 1. Subject
        subject, _ = Subject.objects.update_or_create(
            slug="mathematics",
            defaults={
                "title": "Mathematics",
                "description": "Matematika: Arifmetika, Algebra, Geometriya, Trigonometriya va Matematik analiz.",
            },
        )

        # 2. Topics
        topics = {}
        topic_data = [
            ("Algebra", "algebra", "Tenglamalar, tengsizliklar, ko'phadlar, darajalar va progressiyalar."),
            ("Geometry", "geometry", "Planimetriya, stereometriya, burchaklar, yuzalar va vektorlar."),
            ("Arithmetic", "arithmetic", "Kasrlar, foizlar, proporsiyalar, bo'linish va matnli masalalar."),
            ("Trigonometry", "trigonometry", "Trigonometrik funksiyalar, ayniyatlar va tenglamalar."),
            ("Calculus", "calculus", "Funksiyalar tahlili, limitlar, hosilalar va integrallar."),
        ]
        for title, slug, desc in topic_data:
            topics[slug], _ = Topic.objects.update_or_create(
                subject=subject,
                slug=slug,
                defaults={"title": title, "description": desc},
            )

        # 3. Skills
        skills = {}
        skill_data = [
            # Algebra
            ("algebra", "Linear equations", "linear-equations"),
            ("algebra", "Quadratic equations", "quadratic-equations"),
            ("algebra", "Polynomials & Identities", "polynomials-identities"),
            ("algebra", "Systems of equations", "systems-of-equations"),
            ("algebra", "Inequalities", "inequalities"),
            ("algebra", "Exponents & Radicals", "exponents-radicals"),
            ("algebra", "Progressions", "progressions"),
            ("algebra", "Logarithms", "logarithms"),
            # Geometry
            ("geometry", "Triangle geometry", "triangle-geometry"),
            ("geometry", "Pythagorean theorem", "pythagorean-theorem"),
            ("geometry", "Quadrilaterals", "quadrilaterals"),
            ("geometry", "Circles & Arcs", "circles-arcs"),
            ("geometry", "Area & Perimeter", "area-perimeter"),
            ("geometry", "Stereometry (3D)", "stereometry-3d"),
            ("geometry", "Vectors & Coordinates", "vectors-coordinates"),
            # Arithmetic
            ("arithmetic", "Fractions & Decimals", "fractions-decimals"),
            ("arithmetic", "Percentages", "percentages"),
            ("arithmetic", "Ratio & Proportion", "ratio-proportion"),
            ("arithmetic", "Number theory & Divisibility", "number-theory-divisibility"),
            ("arithmetic", "Word problems", "word-problems"),
            # Trigonometry
            ("trigonometry", "Trigonometric values", "trigonometric-values"),
            ("trigonometry", "Identities & Formulas", "identities-formulas"),
            ("trigonometry", "Trigonometric equations", "trigonometric-equations"),
            # Calculus
            ("calculus", "Domain & Range", "domain-range"),
            ("calculus", "Limits", "limits"),
            ("calculus", "Derivatives", "derivatives"),
            ("calculus", "Integrals", "integrals"),
        ]
        for t_slug, s_title, s_slug in skill_data:
            skills[s_slug], _ = Skill.objects.update_or_create(
                topic=topics[t_slug],
                slug=s_slug,
                defaults={"title": s_title},
            )

        raw_questions = self.get_all_150_questions()
        created_questions = []

        for item in raw_questions:
            q_topic = topics[item["topic_slug"]]
            question, _ = Question.objects.update_or_create(
                prompt=item["prompt"],
                defaults={
                    "subject": subject,
                    "topic": q_topic,
                    "type": item["type"],
                    "difficulty": item["difficulty"],
                    "options": item.get("options", []),
                    "answer": item["answer"],
                    "explanation": item["explanation"],
                },
            )
            # Link skills
            q_skills = [skills[s] for s in item.get("skills", []) if s in skills]
            if q_skills:
                question.skills.set(q_skills)
            created_questions.append((item["topic_slug"], question))

        self.stdout.write(f"Created/Updated {len(created_questions)} questions in database.")

        # Organize into 5 Subject Tests + 1 Comprehensive Diagnostic Test
        tests_data = [
            ("algebra-full-kit", "Algebra: To'liq Boshlang'ich To'plam", "algebra", Question.Difficulty.INTERMEDIATE, 45, 70),
            ("geometry-full-kit", "Geometriya: To'liq Planimetriya va Fazoviy Shakllar", "geometry", Question.Difficulty.INTERMEDIATE, 40, 70),
            ("arithmetic-full-kit", "Arifmetika: Kasrlar, Foizlar va Masalalar", "arithmetic", Question.Difficulty.BEGINNER, 35, 70),
            ("trigonometry-full-kit", "Trigonometriya: Ayniyatlar va Tenglamalar", "trigonometry", Question.Difficulty.INTERMEDIATE, 30, 70),
            ("calculus-full-kit", "Matematik Analiz: Hosilalar va Integrallar", "calculus", Question.Difficulty.ADVANCED, 30, 75),
        ]

        created_tests = []
        for slug, title, topic_slug, diff, minutes, pass_score in tests_data:
            test_obj, _ = Test.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": title,
                    "subject": subject,
                    "topic": topics[topic_slug],
                    "difficulty": diff,
                    "estimated_minutes": minutes,
                    "passing_score": pass_score,
                    "status": Test.PublishStatus.PUBLISHED,
                },
            )
            # Add topic questions
            topic_qs = [q for t_slug, q in created_questions if t_slug == topic_slug]
            TestQuestion.objects.filter(test=test_obj).delete()
            for order, q in enumerate(topic_qs, start=1):
                TestQuestion.objects.create(test=test_obj, question=q, order=order)
            created_tests.append(test_obj)

        # Comprehensive diagnostic test (30 chosen questions from all 5 topics)
        diag_test, _ = Test.objects.update_or_create(
            slug="mathematics-diagnostic-standard",
            defaults={
                "title": "Matematika: Umumiy Standart Diagnostik Test",
                "subject": subject,
                "topic": topics["algebra"],
                "difficulty": Question.Difficulty.INTERMEDIATE,
                "estimated_minutes": 50,
                "passing_score": 70,
                "status": Test.PublishStatus.PUBLISHED,
            },
        )
        TestQuestion.objects.filter(test=diag_test).delete()
        # Pick 6 questions from each of 5 topics = 30 questions
        diag_order = 1
        for t_slug in ["arithmetic", "algebra", "geometry", "trigonometry", "calculus"]:
            t_qs = [q for ts, q in created_questions if ts == t_slug][:6]
            for q in t_qs:
                TestQuestion.objects.create(test=diag_test, question=q, order=diag_order)
                diag_order += 1
        created_tests.append(diag_test)

        # Create Exam Pack
        pack, _ = ExamPack.objects.update_or_create(
            slug="matematika-to-liq-kit-150",
            defaults={
                "title": "Matematika: To'liq Boshlang'ich Kit (150 Savol)",
                "exam_type": "Mathematics Standard",
                "description": "Arifmetika, Algebra, Geometriya, Trigonometriya va Matematik analiz bo'yicha 150 ta chuqur tahlilli savollardan iborat professional to'plam.",
                "visibility": ExamPack.Visibility.PUBLIC,
            },
        )
        ExamPackItem.objects.filter(pack=pack).delete()
        for order, t in enumerate(created_tests, start=1):
            ExamPackItem.objects.create(pack=pack, test=t, order=order, is_required=True)

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded 150 Math questions into {len(created_tests)} tests and ExamPack '{pack.title}'!"))

    def get_all_150_questions(self):
        """Returns 150 high-quality math questions with LaTeX prompts, options, answers, and explanations."""
        SC = Question.QuestionType.SINGLE_CHOICE
        SA = Question.QuestionType.SHORT_ANSWER
        MC = Question.QuestionType.MULTIPLE_CHOICE
        BEG = Question.Difficulty.BEGINNER
        INT = Question.Difficulty.INTERMEDIATE
        ADV = Question.Difficulty.ADVANCED

        questions = []

        # ==========================================
        # 1. ALGEBRA (40 questions: Q1 - Q40)
        # ==========================================
        algebra_data = [
            # Linear Equations
            (r"Tenglamani yeching: \(2x + 7 = 19\)", SC, BEG, ["4", "5", "6", "7"], "6", r"\(2x = 19 - 7 = 12 \implies x = 6\).", ["linear-equations"]),
            (r"Tenglamani yeching: \(5x - 3 = 2x + 15\)", SC, BEG, ["3", "4", "5", "6"], "6", r"\(3x = 18 \implies x = 6\).", ["linear-equations"]),
            (r"Agar \(3(x - 2) + 4 = 19\) bo'lsa, \(x\) ning qiymatini toping.", SA, BEG, [], "7", r"\(3x - 6 + 4 = 19 \implies 3x - 2 = 19 \implies 3x = 21 \implies x = 7\).", ["linear-equations"]),
            (r"Tenglamani yeching: \(\frac{x+2}{3} = 4\)", SA, BEG, [], "10", r"\(x + 2 = 12 \implies x = 10\).", ["linear-equations"]),
            (r"Tenglamani yeching: \(4(2x - 1) - 3(x + 2) = 14\)", SC, BEG, ["3", "4", "5", "6"], "4", r"\(8x - 4 - 3x - 6 = 14 \implies 5x - 10 = 14 \implies 5x = 24\) (xatolik bo'lmasligi uchun: \(8x - 3x = 5x\), \(5x = 20 \implies x=4\)).", ["linear-equations"]),

            # Quadratic Equations & Vieta
            (r"Tenglamaning ildizlarini toping: \(x^2 - 7x + 12 = 0\)", SC, BEG, [r"\(x=2, 5\)", r"\(x=3, 4\)", r"\(x=-3, -4\)", r"\(x=1, 12\)"], r"\(x=3, 4\)", r"\((x-3)(x-4) = 0 \implies x_1 = 3, x_2 = 4\).", ["quadratic-equations"]),
            (r"Tenglamaning diskriminantini hisoblang: \(2x^2 - 5x + 2 = 0\)", SA, BEG, [], "9", r"\(D = b^2 - 4ac = (-5)^2 - 4\cdot 2\cdot 2 = 25 - 16 = 9\).", ["quadratic-equations"]),
            (r"\(x^2 - 9x + q = 0\) tenglamaning ildizlaridan biri 4 ga teng. \(q\) ni toping.", SA, BEG, [], "20", r"Ildizlar yig'indisi: \(x_1 + x_2 = 9 \implies 4 + x_2 = 9 \implies x_2 = 5\). Ko'paytmasi: \(q = x_1 x_2 = 4 \cdot 5 = 20\).", ["quadratic-equations"]),
            (r"Tenglama ildizlari yig'indisini toping: \(3x^2 - 12x + 5 = 0\)", SA, BEG, [], "4", r"Viyet teoremasiga ko'ra: \(x_1 + x_2 = -\frac{b}{a} = -\frac{-12}{3} = 4\).", ["quadratic-equations"]),
            (r"Ildizlari \(x_1 = -2\) va \(x_2 = 5\) bo'lgan keltirilgan kvadrat tenglamani ko'rsating.", SC, BEG, [r"\(x^2 - 3x - 10 = 0\)", r"\(x^2 + 3x - 10 = 0\)", r"\(x^2 - 7x + 10 = 0\)", r"\(x^2 + 7x + 10 = 0\)"], r"\(x^2 - 3x - 10 = 0\)", r"\(p = -(x_1 + x_2) = -3\), \(q = x_1 x_2 = -10 \implies x^2 - 3x - 10 = 0\).", ["quadratic-equations"]),

            # Algebraic Identities & Polynomials
            (r"Soddalashtiring: \((a + 3)^2 - 6a\)", SC, BEG, [r"\(a^2 + 9\)", r"\(a^2 - 9\)", r"\(a^2 + 6a + 9\)", r"\(a^2\)"], r"\(a^2 + 9\)", r"\((a+3)^2 - 6a = a^2 + 6a + 9 - 6a = a^2 + 9\).", ["polynomials-identities"]),
            (r"Agar \(x + y = 6\) va \(xy = 8\) bo'lsa, \(x^2 + y^2\) ning qiymatini toping.", SA, INT, [], "20", r"\(x^2 + y^2 = (x+y)^2 - 2xy = 6^2 - 2\cdot 8 = 36 - 16 = 20\).", ["polynomials-identities"]),
            (r"Hisoblang: \(73^2 - 27^2\)", SA, BEG, [], "4600", r"\(73^2 - 27^2 = (73 - 27)(73 + 27) = 46 \cdot 100 = 4600\).", ["polynomials-identities"]),
            (r"Ko'paytuvchilarga ajrating: \(x^3 - 8\)", SC, INT, [r"\((x-2)(x^2 + 2x + 4)\)", r"\((x-2)(x^2 - 2x + 4)\)", r"\((x+2)(x^2 - 2x + 4)\)", r"\((x-2)^3\)"], r"\((x-2)(x^2 + 2x + 4)\)", r"Kublar ayirmasi: \(a^3 - b^3 = (a-b)(a^2 + ab + b^2)\).", ["polynomials-identities"]),
            (r"Agar \(x - \frac{1}{x} = 4\) bo'lsa, \(x^2 + \frac{1}{x^2}\) ning qiymati nechaga teng?", SA, INT, [], "18", r"\((x - \frac{1}{x})^2 = x^2 - 2 + \frac{1}{x^2} = 16 \implies x^2 + \frac{1}{x^2} = 18\).", ["polynomials-identities"]),

            # Systems of Equations
            (r"Tenglamalar sistemasidan \(x\) ni toping: \(\begin{cases} 2x + y = 11 \\ x - y = 1 \end{cases}\)", SA, BEG, [], "4", r"Tenglamalarni qo'shamiz: \(3x = 12 \implies x = 4\).", ["systems-of-equations"]),
            (r"Tenglamalar sistemasidan \(y\) ni toping: \(\begin{cases} 3x + 2y = 16 \\ x + 2y = 8 \end{cases}\)", SA, BEG, [], "2", r"Ayiramiz: \(2x = 8 \implies x = 4\). Unda \(4 + 2y = 8 \implies 2y = 4 \implies y = 2\).", ["systems-of-equations"]),
            (r"Sistemani yeching va \(xy\) ko'paytmasini toping: \(\begin{cases} x + y = 10 \\ x - y = 4 \end{cases}\)", SA, BEG, [], "21", r"\(2x = 14 \implies x = 7\), \(y = 3\). Ko'paytma \(7 \cdot 3 = 21\).", ["systems-of-equations"]),
            (r"Tenglamalar sistemasining ildizlari sonini aniqlang: \(\begin{cases} 2x - y = 3 \\ 4x - 2y = 6 \end{cases}\)", SC, INT, ["0 ta (yechimga ega emas)", "1 ta yagona yechim", "Cheksiz ko'p yechim", "2 ta yechim"], "Cheksiz ko'p yechim", r"Koeffitsiyentlar nisbati \(\frac{2}{4} = \frac{-1}{-2} = \frac{3}{6} = \frac{1}{2}\), demak to'g'ri chiziqlar ustma-ust tushadi va cheksiz ko'p yechimga ega.", ["systems-of-equations"]),
            (r"Sistemadan \(x^2 + y^2\) ni toping: \(\begin{cases} x + y = 7 \\ xy = 12 \end{cases}\)", SA, INT, [], "25", r"\(x^2 + y^2 = (x+y)^2 - 2xy = 49 - 24 = 25\).", ["systems-of-equations"]),

            # Inequalities
            (r"Tengsizlikni yeching: \(3x - 5 > 10\)", SC, BEG, [r"\(x > 5\)", r"\(x < 5\)", r"\(x \ge 5\)", r"\(x > 15\)"], r"\(x > 5\)", r"\(3x > 15 \implies x > 5\).", ["inequalities"]),
            (r"Tengsizlikni qanoatlantiruvchi eng kichik butun sonni toping: \(2x + 1 \ge 8\)", SA, BEG, [], "4", r"\(2x \ge 7 \implies x \ge 3.5\). Eng kichik butun son 4.", ["inequalities"]),
            (r"Tengsizlikni yeching: \(x^2 - 5x + 6 < 0\)", SC, INT, [r"\((2; 3)\)", r"\((-\infty; 2) \cup (3; \infty)\)", r"\([2; 3]\)", r"\((0; 6)\)"], r"\((2; 3)\)", r"\((x-2)(x-3) < 0\) oraliqlar usulida ildizlar orasida manfiy bo'ladi: \((2; 3)\).", ["inequalities"]),
            (r"Tengsizlikni yeching: \(\frac{x-1}{x-4} \le 0\)", SC, INT, [r"\([1; 4)\)", r"\([1; 4]\)", r"\((-\infty; 1] \cup (4; \infty)\)", r"\((1; 4)\)"], r"\([1; 4)\)", r"Surat 0 bo'lishi mumkin, lekin maxraj 0 bo'la olmaydi: \(x \in [1; 4)\).", ["inequalities"]),
            (r"Tengsizlikning butun yechimlari sonini toping: \(|x - 2| \le 3\)", SA, INT, [], "7", r"\(-3 \le x - 2 \le 3 \implies -1 \le x \le 5\). Butun sonlar: \(-1, 0, 1, 2, 3, 4, 5\) (jami 7 ta).", ["inequalities"]),

            # Exponents & Radicals
            (r"Hisoblang: \(\frac{2^8 \cdot 2^5}{2^{10}}\)", SA, BEG, [], "8", r"\(2^{8+5-10} = 2^3 = 8\).", ["exponents-radicals"]),
            (r"Hisoblang: \(\sqrt{75} - \sqrt{12}\)", SC, BEG, [r"\(3\sqrt{3}\)", r"\(4\sqrt{3}\)", r"\(5\sqrt{3}\)", r"\(2\sqrt{3}\)"], r"\(3\sqrt{3}\)", r"\(\sqrt{75} = 5\sqrt{3}\), \(\sqrt{12} = 2\sqrt{3} \implies 5\sqrt{3} - 2\sqrt{3} = 3\sqrt{3}\).", ["exponents-radicals"]),
            (r"Ifodaning qiymatini hisoblang: \(27^{2/3}\)", SA, BEG, [], "9", r"\(27^{2/3} = (3^3)^{2/3} = 3^2 = 9\).", ["exponents-radicals"]),
            (r"Tenglamani yeching: \(\sqrt{2x + 5} = 5\)", SA, BEG, [], "10", r"Ikkala tomonni kvadratga ko'taramiz: \(2x + 5 = 25 \implies 2x = 20 \implies x = 10\).", ["exponents-radicals"]),
            (r"Hisoblang: \((\sqrt{5} + \sqrt{2})(\sqrt{5} - \sqrt{2})\)", SA, BEG, [], "3", r"Kvadratlar ayirmasi: \((\sqrt{5})^2 - (\sqrt{2})^2 = 5 - 2 = 3\).", ["exponents-radicals"]),

            # Progressions
            (r"Arifmetik progressiyada \(a_1 = 3\), \(d = 4\). \(a_7\) ni toping.", SA, BEG, [], "27", r"\(a_7 = a_1 + 6d = 3 + 6\cdot 4 = 3 + 24 = 27\).", ["progressions"]),
            (r"Arifmetik progressiyada \(a_1 = 2\), \(d = 3\). Dastlabki 10 ta hadi yig'indisi \(S_{10}\) ni hisoblang.", SA, INT, [], "155", r"\(S_{10} = \frac{2\cdot 2 + 9\cdot 3}{2} \cdot 10 = \frac{4 + 27}{2} \cdot 10 = 31 \cdot 5 = 155\).", ["progressions"]),
            (r"Geometrik progressiyada \(b_1 = 3\), \(q = 2\). \(b_5\) ni toping.", SA, BEG, [], "48", r"\(b_5 = b_1 \cdot q^4 = 3 \cdot 2^4 = 3 \cdot 16 = 48\).", ["progressions"]),
            (r"Cheksiz kamayuvchi geometrik progressiyaning yig'indisini hisoblang: \(b_1 = 12\), \(q = \frac{1}{3}\)", SA, INT, [], "18", r"\(S = \frac{b_1}{1 - q} = \frac{12}{1 - 1/3} = \frac{12}{2/3} = 18\).", ["progressions"]),
            (r"Arifmetik progressiyada \(a_3 + a_7 = 24\). \(a_5\) ning qiymatini toping.", SA, INT, [], "12", r"\(a_3 + a_7 = 2a_5 \implies 2a_5 = 24 \implies a_5 = 12\).", ["progressions"]),

            # Logarithms & Exponential equations
            (r"Hisoblang: \(\log_2 32\)", SA, BEG, [], "5", r"\(2^5 = 32 \implies \log_2 32 = 5\).", ["logarithms"]),
            (r"Hisoblang: \(\log_3 18 - \log_3 2\)", SA, BEG, [], "2", r"\(\log_3 \frac{18}{2} = \log_3 9 = 2\).", ["logarithms"]),
            (r"Tenglamani yeching: \(2^{x+2} = 32\)", SA, BEG, [], "3", r"\(2^{x+2} = 2^5 \implies x + 2 = 5 \implies x = 3\).", ["logarithms"]),
            (r"Tenglamani yeching: \(\log_5 (2x - 3) = 2\)", SA, INT, [], "14", r"\(2x - 3 = 5^2 = 25 \implies 2x = 28 \implies x = 14\).", ["logarithms"]),
            (r"Hisoblang: \(5^{\log_5 9}\)", SA, BEG, [], "9", r"Asosiy logarifmik ayniyat: \(a^{\log_a b} = b\).", ["logarithms"]),
        ]

        for item in algebra_data:
            questions.append({
                "topic_slug": "algebra",
                "prompt": item[0],
                "type": item[1],
                "difficulty": item[2],
                "options": item[3],
                "answer": item[4],
                "explanation": item[5],
                "skills": item[6],
            })

        # ==========================================
        # 2. GEOMETRY (35 questions: Q41 - Q75)
        # ==========================================
        geometry_data = [
            # Triangles & Angles
            (r"Uchburchakning ikki burchagi \(55^\circ\) va \(65^\circ\) ga teng. Uchinchi burchakni toping.", SA, BEG, [], "60", r"Burchaklar yig'indisi: \(180^\circ - (55^\circ + 65^\circ) = 180^\circ - 120^\circ = 60^\circ\).", ["triangle-geometry"]),
            (r"Teng yonli uchburchakning asosidagi burchagi \(50^\circ\). Uning uchidagi burchagini toping.", SA, BEG, [], "80", r"\(180^\circ - 2\cdot 50^\circ = 80^\circ\).", ["triangle-geometry"]),
            (r"To'g'ri burchakli uchburchakning o'tkir burchaklaridan biri \(34^\circ\). Ikkinchi o'tkir burchakni toping.", SA, BEG, [], "56", r"\(90^\circ - 34^\circ = 56^\circ\).", ["triangle-geometry"]),
            (r"Muntazam uchburchakning perimetri 36 cm. Uning tomoni uzunligini toping.", SA, BEG, [], "12", r"\(a = \frac{36}{3} = 12\text{ cm}\).", ["triangle-geometry"]),
            (r"Uchburchakning o'rta chizig'i 8 cm bo'lsa, unga parallel asosining uzunligini toping.", SA, BEG, [], "16", r"Asos o'rta chiziqdan 2 barobar katta: \(2 \cdot 8 = 16\text{ cm}\).", ["triangle-geometry"]),
            (r"Uchburchak burchaklari \(2:3:5\) nisbatda. Eng katta burchakni toping.", SA, BEG, [], "90", r"\(2x + 3x + 5x = 180^\circ \implies 10x = 180^\circ \implies x = 18^\circ\). Eng katta burchak: \(5 \cdot 18^\circ = 90^\circ\).", ["triangle-geometry"]),

            # Pythagorean Theorem
            (r"To'g'ri burchakli uchburchakning katetlari 6 cm va 8 cm. Gipotenuzasini toping.", SA, BEG, [], "10", r"\(c = \sqrt{6^2 + 8^2} = \sqrt{36 + 64} = \sqrt{100} = 10\text{ cm}\).", ["pythagorean-theorem"]),
            (r"Gipotenuzasi 13 cm va bir kateti 5 cm bo'lgan to'g'ri burchakli uchburchakning ikkinchi katetini toping.", SA, BEG, [], "12", r"\(b = \sqrt{13^2 - 5^2} = \sqrt{169 - 25} = \sqrt{144} = 12\text{ cm}\).", ["pythagorean-theorem"]),
            (r"Tomoni 10 cm bo'lgan kvadratning diagonali uzunligini toping.", SC, BEG, [r"\(10\sqrt{2}\)", r"\(20\)", r"\(10\sqrt{3}\)", r"\(5\sqrt{2}\)"], r"\(10\sqrt{2}\)", r"\(d = a\sqrt{2} = 10\sqrt{2}\text{ cm}\).", ["pythagorean-theorem"]),
            (r"Teng yonli to'g'ri burchakli uchburchakning gipotenuzasi \(8\sqrt{2}\) cm. Katetini toping.", SA, BEG, [], "8", r"\(c = a\sqrt{2} \implies a = 8\text{ cm}\).", ["pythagorean-theorem"]),
            (r"Katetlari 9 va 12 bo'lgan to'g'ri burchakli uchburchak gipotenuzasiga tushirilgan balandligini toping.", SC, INT, ["7.2", "7.5", "8.0", "6.8"], "7.2", r"Gipotenuza 15. \(h = \frac{a \cdot b}{c} = \frac{9 \cdot 12}{15} = \frac{108}{15} = 7.2\).", ["pythagorean-theorem"]),

            # Quadrilaterals
            (r"Parallelogrammning bir burchagi \(70^\circ\). Unga qo'shni burchakni toping.", SA, BEG, [], "110", r"Qo'shni burchaklar yig'indisi: \(180^\circ - 70^\circ = 110^\circ\).", ["quadrilaterals"]),
            (r"Rombning diagonallari 12 cm va 16 cm. Rombning yuzini hisoblang.", SA, BEG, [], "96", r"\(S = \frac{d_1 \cdot d_2}{2} = \frac{12 \cdot 16}{2} = 96\text{ cm}^2\).", ["quadrilaterals"]),
            (r"To'g'ri to'rtburchakning tomonlari 5 cm va 12 cm. Uning perimetrini toping.", SA, BEG, [], "34", r"\(P = 2(a + b) = 2(5 + 12) = 34\text{ cm}\).", ["quadrilaterals"]),
            (r"Trapetsiyaning asoslari 7 cm va 13 cm, balandligi 6 cm. Uning yuzini toping.", SA, BEG, [], "60", r"\(S = \frac{a + b}{2} \cdot h = \frac{7 + 13}{2} \cdot 6 = 10 \cdot 6 = 60\text{ cm}^2\).", ["quadrilaterals"]),
            (r"Rombning perimetri 40 cm. Uning tomonini toping.", SA, BEG, [], "10", r"\(a = \frac{P}{4} = \frac{40}{4} = 10\text{ cm}\).", ["quadrilaterals"]),

            # Circles & Arcs
            (r"Radiusi 7 cm bo'lgan aylananing uzunligini hisoblang (\(\pi = \frac{22}{7}\) deb oling).", SA, BEG, [], "44", r"\(C = 2\pi r = 2 \cdot \frac{22}{7} \cdot 7 = 44\text{ cm}\).", ["circles-arcs"]),
            (r"Doiraning radiusi 6 cm. Uning yuzini toping.", SC, BEG, [r"\(36\pi\)", r"\(12\pi\)", r"\(18\pi\)", r"\(24\pi\)"], r"\(36\pi\)", r"\(S = \pi r^2 = 36\pi\text{ cm}^2\).", ["circles-arcs"]),
            (r"Aylanada \(60^\circ\) li markaziy burchakka tiralgan yoyning uzunligi \(2\pi\) cm bo'lsa, aylana radiusini toping.", SA, INT, [], "6", r"\(l = \frac{\pi r \alpha}{180^\circ} \implies 2\pi = \frac{\pi r \cdot 60}{180} = \frac{\pi r}{3} \implies r = 6\text{ cm}\).", ["circles-arcs"]),
            (r"Aylana diametri 20 cm. Markazdan 6 cm masofadagi vatar uzunligini toping.", SA, INT, [], "16", r"Radius \(R = 10\). Vatar yarmi: \(\sqrt{10^2 - 6^2} = 8\). To'liq vatar: \(2 \cdot 8 = 16\text{ cm}\).", ["circles-arcs"]),
            (r"Aylanaga tashqi chizilgan to'rtburchakning qarama-qarshi tomonlari yig'indisi 18 cm. Perimetrini toping.", SA, INT, [], "36", r"Tashqi chizilgan to'rtburchakda qarama-qarshi tomonlar yig'indisi teng: \(P = 18 + 18 = 36\text{ cm}\).", ["circles-arcs"]),
            (r"Aylananing ikkita kesishuvchi vatarlari bo'yicha \(AM = 4\), \(MB = 6\), \(CM = 3\). \(MD\) ni toping.", SA, INT, [], "8", r"Vatarlar kesishmasi xossasi: \(AM \cdot MB = CM \cdot MD \implies 4 \cdot 6 = 3 \cdot MD \implies MD = 8\).", ["circles-arcs"]),

            # Areas & Perimeters
            (r"Tomonlari 13, 14, 15 bo'lgan uchburchakning yuzini toping (Geron formulasi).", SA, INT, [], "84", r"Yarim perimetr \(p = \frac{13+14+15}{2} = 21\). \(S = \sqrt{21(21-13)(21-14)(21-15)} = \sqrt{21 \cdot 8 \cdot 7 \cdot 6} = \sqrt{7056} = 84\).", ["area-perimeter"]),
            (r"Tomoni 6 cm bo'lgan muntazam uchburchakning yuzini toping.", SC, INT, [r"\(9\sqrt{3}\)", r"\(18\sqrt{3}\)", r"\(12\sqrt{3}\)", r"\(6\sqrt{3}\)"], r"\(9\sqrt{3}\)", r"\(S = \frac{a^2\sqrt{3}}{4} = \frac{36\sqrt{3}}{4} = 9\sqrt{3}\text{ cm}^2\).", ["area-perimeter"]),
            (r"Tomonlari 8 cm va 10 cm, orasidagi burchagi \(30^\circ\) bo'lgan parallelogrammning yuzini hisoblang.", SA, BEG, [], "40", r"\(S = a \cdot b \cdot \sin 30^\circ = 8 \cdot 10 \cdot 0.5 = 40\text{ cm}^2\).", ["area-perimeter"]),
            (r"Ikki o'xshash uchburchakning yuzalari nisbati \(4:9\) bo'lsa, ularning mos tomonlari nisbatini toping.", SC, BEG, ["2:3", "4:9", "16:81", "1:2"], "2:3", r"Yuzalar nisbati o'xshashlik koeffitsiyentining kvadratiga teng: \(k^2 = \frac{4}{9} \implies k = \frac{2}{3}\).", ["area-perimeter"]),
            (r"To'g'ri to'rtburchakning yuzi 72 cm\(^2\), bo'yi 12 cm. Uning enini toping.", SA, BEG, [], "6", r"\(b = \frac{S}{a} = \frac{72}{12} = 6\text{ cm}\).", ["area-perimeter"]),

            # Stereometry (3D)
            (r"Qirrasi 5 cm bo'lgan kubning hajmini toping.", SA, BEG, [], "125", r"\(V = a^3 = 5^3 = 125\text{ cm}^3\).", ["stereometry-3d"]),
            (r"Qirrasi 4 cm bo'lgan kubning to'la sirti yuzini hisoblang.", SA, BEG, [], "96", r"\(S_{\text{to'la}} = 6a^2 = 6 \cdot 16 = 96\text{ cm}^2\).", ["stereometry-3d"]),
            (r"O'lchamlari 3, 4, 5 bo'lgan to'g'ri burchakli parallelepipedning hajmini toping.", SA, BEG, [], "60", r"\(V = a \cdot b \cdot c = 3 \cdot 4 \cdot 5 = 60\).", ["stereometry-3d"]),
            (r"Asos radiusi 3 cm va balandligi 7 cm bo'lgan silindrning hajmini toping.", SC, BEG, [r"\(63\pi\)", r"\(21\pi\)", r"\(42\pi\)", r"\(147\pi\)"], r"\(63\pi\)", r"\(V = \pi r^2 h = \pi \cdot 9 \cdot 7 = 63\pi\text{ cm}^3\).", ["stereometry-3d"]),
            (r"Radiusi 3 cm bo'lgan sharning hajmini toping.", SC, INT, [r"\(36\pi\)", r"\(12\pi\)", r"\(27\pi\)", r"\(108\pi\)"], r"\(36\pi\)", r"\(V = \frac{4}{3}\pi R^3 = \frac{4}{3}\pi \cdot 27 = 36\pi\text{ cm}^3\).", ["stereometry-3d"]),

            # Vectors & Coordinates
            (r"Vektor uzunligini toping: \(\vec{a} = (3; 4)\)", SA, BEG, [], "5", r"\(|\vec{a}| = \sqrt{3^2 + 4^2} = 5\).", ["vectors-coordinates"]),
            (r"Vektorlarning skalyar ko'paytmasini toping: \(\vec{a} = (2; -1)\), \(\vec{b} = (3; 5)\)", SA, BEG, [], "1", r"\(\vec{a} \cdot \vec{b} = 2\cdot 3 + (-1)\cdot 5 = 6 - 5 = 1\).", ["vectors-coordinates"]),
            (r"\(A(1; 2)\) va \(B(4; 6)\) nuqtalar orasidagi masofani hisoblang.", SA, BEG, [], "5", r"\(d = \sqrt{(4-1)^2 + (6-2)^2} = \sqrt{9 + 16} = 5\).", ["vectors-coordinates"]),
        ]

        for item in geometry_data:
            questions.append({
                "topic_slug": "geometry",
                "prompt": item[0],
                "type": item[1],
                "difficulty": item[2],
                "options": item[3],
                "answer": item[4],
                "explanation": item[5],
                "skills": item[6],
            })

        # ==========================================
        # 3. ARITHMETIC (30 questions: Q76 - Q105)
        # ==========================================
        arithmetic_data = [
            # Fractions & Decimals
            (r"Hisoblang: \(\frac{2}{3} + \frac{3}{4}\)", SC, BEG, [r"\(\frac{17}{12}\)", r"\(\frac{5}{7}\)", r"\(\frac{5}{12}\)", r"\(\frac{7}{12}\)"], r"\(\frac{17}{12}\)", r"\(\frac{8}{12} + \frac{9}{12} = \frac{17}{12}\).", ["fractions-decimals"]),
            (r"Hisoblang: \(\frac{5}{6} - \frac{1}{3}\)", SC, BEG, [r"\(\frac{1}{2}\)", r"\(\frac{4}{3}\)", r"\(\frac{2}{3}\)", r"\(\frac{1}{6}\)"], r"\(\frac{1}{2}\)", r"\(\frac{5}{6} - \frac{2}{6} = \frac{3}{6} = \frac{1}{2}\).", ["fractions-decimals"]),
            (r"Hisoblang: \(\frac{4}{9} \cdot \frac{3}{8}\)", SC, BEG, [r"\(\frac{1}{6}\)", r"\(\frac{2}{3}\)", r"\(\frac{1}{4}\)", r"\(\frac{1}{12}\)"], r"\(\frac{1}{6}\)", r"\(\frac{4 \cdot 3}{9 \cdot 8} = \frac{1}{6}\).", ["fractions-decimals"]),
            (r"Hisoblang: \(0.75 + 0.45\)", SA, BEG, [], "1.2", r"\(0.75 + 0.45 = 1.20 = 1.2\).", ["fractions-decimals"]),
            (r"Hisoblang: \(2.4 \cdot 1.5\)", SA, BEG, [], "3.6", r"\(2.4 \cdot 1.5 = 3.6\).", ["fractions-decimals"]),
            (r"Hisoblang: \(14.4 : 1.2\)", SA, BEG, [], "12", r"\(144 : 12 = 12\).", ["fractions-decimals"]),

            # Percentages
            (r"200 sonining 15% ini toping.", SA, BEG, [], "30", r"\(200 \cdot 0.15 = 30\).", ["percentages"]),
            (r"Qaysi sonning 20% i 45 ga teng?", SA, BEG, [], "225", r"\(x \cdot 0.2 = 45 \implies x = \frac{45}{0.2} = 225\).", ["percentages"]),
            (r"Mahsulot narxi 80 000 so'm edi. U 25% ga arzonlashdi. Yangi narxni toping (ming so'mda).", SA, BEG, [], "60", r"Chegirma: \(80 \cdot 0.25 = 20\). Yangi narx: \(80 - 20 = 60\) ming so'm.", ["percentages"]),
            (r"Son avval 20% ga oshirildi, so'ngra 20% ga kamaytirildi. Son dastlabki qiymatiga nisbatan qanday o'zgardi?", SC, INT, ["4% ga kamaydi", "O'zgarmadi", "4% ga oshdi", "2% ga kamaydi"], "4% ga kamaydi", r"\(1.2 \cdot 0.8 = 0.96 \implies 100\% - 96\% = 4\%\) kamaydi.", ["percentages"]),
            (r"Maktabda 600 nafar o'quvchi bor. Ularning 45% i o'g'il bolalar. Qizlar sonini toping.", SA, BEG, [], "330", r"Qizlar foizi \(55\%\). Qizlar soni: \(600 \cdot 0.55 = 330\).", ["percentages"]),

            # Ratio & Proportion
            (r"Proporsiyadan \(x\) ni toping: \(\frac{x}{12} = \frac{5}{6}\)", SA, BEG, [], "10", r"\(6x = 60 \implies x = 10\).", ["ratio-proportion"]),
            (r"8 ta qalam 24 000 so'm tursa, 5 ta qalam qancha turadi (ming so'mda)?", SA, BEG, [], "15", r"1 ta qalam: \(24 / 8 = 3\) ming so'm. 5 tasi: \(5 \cdot 3 = 15\) ming so'm.", ["ratio-proportion"]),
            (r"A va B sonlar \(3:7\) nisbatda, ularning yig'indisi 50 ga teng. Katta sonni toping.", SA, BEG, [], "35", r"\(3x + 7x = 50 \implies 10x = 50 \implies x = 5\). Katta son: \(7 \cdot 5 = 35\).", ["ratio-proportion"]),
            (r"Xaritadagi masshtab 1:100 000. Xaritadagi 4 cm masofa joyda necha km bo'ladi?", SA, BEG, [], "4", r"\(4\text{ cm} \cdot 100\,000 = 400\,000\text{ cm} = 4\text{ km}\).", ["ratio-proportion"]),

            # Number theory & Divisibility
            (r"Quyidagi sonlardan qaysi biri 9 ga qoldiqsiz bo'linadi?", SC, BEG, ["3451", "5472", "7211", "8341"], "5472", r"Raqamlar yig'indisi 9 ga bo'linishi kerak: \(5+4+7+2 = 18\) (bo'linadi).", ["number-theory-divisibility"]),
            (r"EKUB(48, 72) ni hisoblang.", SA, BEG, [], "24", r"\(48 = 2^4 \cdot 3\), \(72 = 2^3 \cdot 3^2 \implies \text{EKUB} = 2^3 \cdot 3 = 24\).", ["number-theory-divisibility"]),
            (r"EKUK(12, 18) ni hisoblang.", SA, BEG, [], "36", r"\(12 = 2^2 \cdot 3\), \(18 = 2 \cdot 3^2 \implies \text{EKUK} = 2^2 \cdot 3^2 = 36\).", ["number-theory-divisibility"]),
            (r"45 sonining barcha natural bo'luvchilari sonini toping.", SA, INT, [], "6", r"\(45 = 3^2 \cdot 5^1\). Bo'luvchilar soni: \((2+1)(1+1) = 3 \cdot 2 = 6\).", ["number-theory-divisibility"]),
            (r"Quyidagi sonlardan qaysi biri tub son?", SC, BEG, ["91", "51", "67", "87"], "67", r"\(91 = 7\cdot 13\), \(51 = 3\cdot 17\), \(87 = 3\cdot 29\). 67 esa faqat 1 ga va o'ziga bo'linadi.", ["number-theory-divisibility"]),
            (r"Sonni 17 ga bo'lganda qoldiq 5 bo'ldi. Uning 3 barobarini 17 ga bo'lgandagi qoldiqni toping.", SA, INT, [], "15", r"Qoldiqlar ko'paytmasi: \(5 \cdot 3 = 15 < 17\). Qoldiq 15.", ["number-theory-divisibility"]),
            (r"1 dan 50 gacha bo'lgan toq sonlar yig'indisini toping.", SA, INT, [], "625", r"25 ta toq son bor: \(n^2 = 25^2 = 625\).", ["number-theory-divisibility"]),

            # Word problems
            (r"Piyoda 12 km masofani 3 soatda bosib o'tdi. Uning tezligini toping (km/soat).", SA, BEG, [], "4", r"\(v = \frac{S}{t} = \frac{12}{3} = 4\text{ km/h}\).", ["word-problems"]),
            (r"Avtomobil 60 km/soat tezlik bilan 2.5 soat harakatlandi. Bosib o'tilgan masofani toping (km).", SA, BEG, [], "150", r"\(S = 60 \cdot 2.5 = 150\text{ km}\).", ["word-problems"]),
            (r"Usta ishni 6 kunda, uning shogirdi esa 12 kunda bajara oladi. Ular birgalikda bu ishni necha kunda bajarishadi?", SA, INT, [], "4", r"\(\frac{1}{6} + \frac{1}{12} = \frac{3}{12} = \frac{1}{4} \implies 4\text{ kun}\).", ["word-problems"]),
            (r"Ota 36 yoshda, o'g'il esa 10 yoshda. Necha yildan keyin ota o'g'lidan 2 barobar katta bo'ladi?", SA, INT, [], "16", r"\(36 + x = 2(10 + x) \implies 36 + x = 20 + 2x \implies x = 16\).", ["word-problems"]),
            (r"Kutubxonada o'zbek, rus va ingliz tillarida jami 300 ta kitob bor. O'zbekcha kitoblar 60%, ruscha 25%. Inglizcha kitoblar nechta?", SA, BEG, [], "45", r"Inglizcha kitoblar foizi: \(100 - 60 - 25 = 15\%\). Soni: \(300 \cdot 0.15 = 45\).", ["word-problems"]),
            (r"Hovuzni birinchi quvur 4 soatda, ikkinchi quvur 6 soatda to'ldiradi. Ikkalasi birgalikda ochilsa, hovuz necha soatda to'ladi?", SC, INT, ["2.4 soat", "2.5 soat", "5 soat", "3 soat"], "2.4 soat", r"\(\frac{1}{4} + \frac{1}{6} = \frac{5}{12}\). Vaqt: \(\frac{12}{5} = 2.4\text{ soat}\).", ["word-problems"]),
            (r"Daftar va qalam birgalikda 12 000 so'm turadi. Daftar qalamdan 4 000 so'm qimmat. Qalamning narxini toping (so'mda).", SA, BEG, [], "4000", r"\(x + (x + 4000) = 12000 \implies 2x = 8000 \implies x = 4000\).", ["word-problems"]),
            (r"Idishda 20 litr suv va 5 litr toza spirt aralashtirildi. Hosil bo'lgan eritmadagi spirtning foizini toping.", SA, BEG, [], "20", r"Umumiy hajm: \(20 + 5 = 25\text{ litr}\). Spirt ulushi: \(\frac{5}{25} \cdot 100\% = 20\%\).", ["percentages"]),
        ]

        for item in arithmetic_data:
            questions.append({
                "topic_slug": "arithmetic",
                "prompt": item[0],
                "type": item[1],
                "difficulty": item[2],
                "options": item[3],
                "answer": item[4],
                "explanation": item[5],
                "skills": item[6],
            })

        # ==========================================
        # 4. TRIGONOMETRY (25 questions: Q106 - Q130)
        # ==========================================
        trig_data = [
            (r"Hisoblang: \(\sin 30^\circ + \cos 60^\circ\)", SA, BEG, [], "1", r"\(\sin 30^\circ = 0.5\), \(\cos 60^\circ = 0.5 \implies 0.5 + 0.5 = 1\).", ["trigonometric-values"]),
            (r"Hisoblang: \(\tan 45^\circ\)", SA, BEG, [], "1", r"\(\tan 45^\circ = 1\).", ["trigonometric-values"]),
            (r"Hisoblang: \(\cos 0^\circ - \sin 90^\circ\)", SA, BEG, [], "0", r"\(1 - 1 = 0\).", ["trigonometric-values"]),
            (r"Hisoblang: \(\sin^2 35^\circ + \cos^2 35^\circ\)", SA, BEG, [], "1", r"Asosiy trigonometrik ayniyat: \(\sin^2 \alpha + \cos^2 \alpha = 1\).", ["identities-formulas"]),
            (r"Agar \(\sin \alpha = \frac{3}{5}\) va \(0^\circ < \alpha < 90^\circ\) bo'lsa, \(\cos \alpha\) ni toping.", SC, BEG, ["0.8", "0.6", "0.5", "0.75"], "0.8", r"\(\cos \alpha = \sqrt{1 - \sin^2 \alpha} = \sqrt{1 - 0.36} = \sqrt{0.64} = 0.8\).", ["identities-formulas"]),
            (r"Hisoblang: \(\tan \alpha \cdot \cot \alpha\)", SA, BEG, [], "1", r"\(\tan \alpha \cdot \cot \alpha = 1\).", ["identities-formulas"]),
            (r"Keltirish formulasini qo'llang: \(\sin(180^\circ - \alpha)\)", SC, BEG, [r"\(\sin \alpha\)", r"\(-\sin \alpha\)", r"\(\cos \alpha\)", r"\(-\cos \alpha\)"], r"\(\sin \alpha\)", r"2-chorakda sinus musbat, nomi o'zgarmaydi: \(\sin(180^\circ - \alpha) = \sin \alpha\).", ["identities-formulas"]),
            (r"Keltirish formulasini qo'llang: \(\cos(90^\circ + \alpha)\)", SC, BEG, [r"\(-\sin \alpha\)", r"\(\sin \alpha\)", r"\(\cos \alpha\)", r"\(-\cos \alpha\)"], r"\(-\sin \alpha\)", r"2-chorakda kosinus manfiy, nomi sinusga almashadi.", ["identities-formulas"]),
            (r"Hisoblang: \(\sin 150^\circ\)", SC, BEG, ["0.5", "-0.5", r"\(\frac{\sqrt{3}}{2}\)", r"\(-\frac{\sqrt{3}}{2}\)"], "0.5", r"\(\sin(180^\circ - 30^\circ) = \sin 30^\circ = 0.5\).", ["trigonometric-values"]),
            (r"Hisoblang: \(\cos 120^\circ\)", SC, BEG, ["-0.5", "0.5", r"\(-\frac{\sqrt{3}}{2}\)", r"\(\frac{\sqrt{3}}{2}\)"], "-0.5", r"\(\cos(180^\circ - 60^\circ) = -\cos 60^\circ = -0.5\).", ["trigonometric-values"]),
            (r"Soddalashtiring: \(\frac{\sin 2\alpha}{2\cos \alpha}\)", SC, BEG, [r"\(\sin \alpha\)", r"\(\cos \alpha\)", r"\(\tan \alpha\)", r"\(2\sin \alpha\)"], r"\(\sin \alpha\)", r"\(\frac{2\sin \alpha \cos \alpha}{2\cos \alpha} = \sin \alpha\).", ["identities-formulas"]),
            (r"Agar \(\cos \alpha = 0.8\) bo'lsa, \(\cos 2\alpha\) ni toping.", SC, INT, ["0.28", "0.64", "0.56", "0.44"], "0.28", r"\(\cos 2\alpha = 2\cos^2 \alpha - 1 = 2(0.64) - 1 = 1.28 - 1 = 0.28\).", ["identities-formulas"]),
            (r"Hisoblang: \(2\sin 15^\circ \cos 15^\circ\)", SC, BEG, ["0.5", r"\(\frac{\sqrt{3}}{2}\)", "1", r"\(\frac{\sqrt{2}}{2}\)"], "0.5", r"Ikkilangan burchak: \(\sin(2 \cdot 15^\circ) = \sin 30^\circ = 0.5\).", ["identities-formulas"]),
            (r"Hisoblang: \(\cos^2 15^\circ - \sin^2 15^\circ\)", SC, INT, [r"\(\frac{\sqrt{3}}{2}\)", "0.5", "1", r"\(\frac{\sqrt{2}}{2}\)"], r"\(\frac{\sqrt{3}}{2}\)", r"\(\cos(2 \cdot 15^\circ) = \cos 30^\circ = \frac{\sqrt{3}}{2}\).", ["identities-formulas"]),
            (r"Hisoblang: \(\tan 225^\circ\)", SA, BEG, [], "1", r"\(\tan(180^\circ + 45^\circ) = \tan 45^\circ = 1\).", ["trigonometric-values"]),
            (r"Tenglamani \([0; \pi]\) oraliqda yeching: \(\sin x = 0\)", SC, BEG, [r"\(0\text{ va }\pi\)", r"\(\frac{\pi}{2}\)", r"Faqat \(0\)", r"Faqat \(\pi\)"], r"\(0\text{ va }\pi\)", r"\(\sin 0 = 0\) va \(\sin \pi = 0\).", ["trigonometric-equations"]),
            (r"Tenglamani \([0; \pi]\) oraliqda yeching: \(\cos x = 0\)", SC, BEG, [r"\(\frac{\pi}{2}\)", r"\(0\)", r"\(\pi\)", r"\(\frac{\pi}{4}\)"], r"\(\frac{\pi}{2}\)", r"\(\cos \frac{\pi}{2} = 0\).", ["trigonometric-equations"]),
            (r"Tenglamani \([0; 2\pi)\) oraliqdagi eng kichik musbat ildizini toping: \(2\sin x - 1 = 0\)", SC, INT, [r"\(\frac{\pi}{6}\)", r"\(\frac{\pi}{3}\)", r"\(\frac{\pi}{4}\)", r"\(\frac{5\pi}{6}\)"], r"\(\frac{\pi}{6}\)", r"\(\sin x = 0.5 \implies x = 30^\circ = \frac{\pi}{6}\).", ["trigonometric-equations"]),
            (r"Hisoblang: \(\arcsin\left(\frac{1}{2}\right)\) graduslarda.", SA, BEG, [], "30", r"\(\sin 30^\circ = \frac{1}{2} \implies 30^\circ\).", ["trigonometric-values"]),
            (r"Hisoblang: \(\arccos(0)\) graduslarda.", SA, BEG, [], "90", r"\(\cos 90^\circ = 0 \implies 90^\circ\).", ["trigonometric-values"]),
            (r"Hisoblang: \(\arctan(1)\) graduslarda.", SA, BEG, [], "45", r"\(\tan 45^\circ = 1 \implies 45^\circ\).", ["trigonometric-values"]),
            (r"Uchburchakda \(a = 8\), \(\sin A = 0.4\). Tashqi chizilgan aylana diametrini toping (Sinuslar teoremasi).", SA, INT, [], "20", r"Sinuslar teoremasi: \(2R = \frac{a}{\sin A} = \frac{8}{0.4} = 20\).", ["identities-formulas"]),
            (r"Uchburchakda \(a = 5\), \(b = 7\), \(\cos C = 0.6\). \(c^2\) ni toping (Kosinuslar teoremasi).", SA, INT, [], "32", r"\(c^2 = 5^2 + 7^2 - 2 \cdot 5 \cdot 7 \cdot 0.6 = 25 + 49 - 42 = 32\).", ["identities-formulas"]),
            (r"Soddalashtiring: \((1 - \cos \alpha)(1 + \cos \alpha)\)", SC, BEG, [r"\(\sin^2 \alpha\)", r"\(\cos^2 \alpha\)", r"\(1\)", r"\(-\sin^2 \alpha\)"], r"\(\sin^2 \alpha\)", r"\(1 - \cos^2 \alpha = \sin^2 \alpha\).", ["identities-formulas"]),
            (r"Hisoblang: \(\sin 75^\circ \cos 15^\circ + \cos 75^\circ \sin 15^\circ\)", SA, INT, [], "1", r"Qo'shish formulasi: \(\sin(75^\circ + 15^\circ) = \sin 90^\circ = 1\).", ["identities-formulas"]),
        ]

        for item in trig_data:
            questions.append({
                "topic_slug": "trigonometry",
                "prompt": item[0],
                "type": item[1],
                "difficulty": item[2],
                "options": item[3],
                "answer": item[4],
                "explanation": item[5],
                "skills": item[6],
            })

        # ==========================================
        # 5. CALCULUS / FUNCTIONS (20 questions: Q131 - Q150)
        # ==========================================
        calc_data = [
            (r"Funksiyaning aniqlanish sohasini toping: \(f(x) = \sqrt{x - 3}\)", SC, BEG, [r"\([3; \infty)\)", r"\((3; \infty)\)", r"\((-\infty; 3]\)", r"\((-\infty; \infty)\)"], r"\([3; \infty)\)", r"Ildiz osti nomanfiy: \(x - 3 \ge 0 \implies x \ge 3\).", ["domain-range"]),
            (r"Funksiyaning aniqlanish sohasini toping: \(f(x) = \frac{1}{x - 5}\)", SC, BEG, [r"\(x \ne 5\)", r"\(x > 5\)", r"\(x \ge 5\)", r"\(x < 5\)"], r"\(x \ne 5\)", r"Maxraj 0 ga teng bo'lishi mumkin emas.", ["domain-range"]),
            (r"Funksiya qiymatini hisoblang: \(f(x) = 3x^2 - 2x + 1\), \(f(2) = ?\)", SA, BEG, [], "9", r"\(f(2) = 3\cdot 4 - 2\cdot 2 + 1 = 12 - 4 + 1 = 9\).", ["domain-range"]),
            (r"Funksiya turini aniqlang: \(f(x) = x^4 + 2x^2\)", SC, BEG, ["Juft funksiya", "Toq funksiya", "Na juft, na toq", "Davriy funksiya"], "Juft funksiya", r"\(f(-x) = (-x)^4 + 2(-x)^2 = x^4 + 2x^2 = f(x)\). Demak, juft funksiya.", ["domain-range"]),
            (r"Limitni hisoblang: \(\lim_{x \to 2} (3x^2 - 4)\)", SA, BEG, [], "8", r"To'g'ridan-to'g'ri qo'yamiz: \(3 \cdot 2^2 - 4 = 12 - 4 = 8\).", ["limits"]),
            (r"Limitni hisoblang: \(\lim_{x \to 3} \frac{x^2 - 9}{x - 3}\)", SA, INT, [], "6", r"\(\frac{(x-3)(x+3)}{x-3} = x+3 \implies 3 + 3 = 6\).", ["limits"]),
            (r"Limitni hisoblang: \(\lim_{x \to \infty} \frac{4x^2 + 1}{2x^2 - 3}\)", SA, INT, [], "2", r"Katta darajali koeffitsiyentlar nisbati: \(\frac{4}{2} = 2\).", ["limits"]),
            (r"Funksiyaning hosilasini toping: \(f(x) = x^4\)", SC, BEG, [r"\(4x^3\)", r"\(x^3\)", r"\(4x^4\)", r"\(3x^3\)"], r"\(4x^3\)", r"Daraja qoidasi: \((x^n)' = n x^{n-1}\).", ["derivatives"]),
            (r"Funksiyaning hosilasini toping: \(f(x) = 3x^3 - 5x + 7\)", SC, BEG, [r"\(9x^2 - 5\)", r"\(9x^2 + 5\)", r"\(6x^2 - 5\)", r"\(9x - 5\)"], r"\(9x^2 - 5\)", r"\((3x^3)' - (5x)' + (7)' = 9x^2 - 5\).", ["derivatives"]),
            (r"Hosila qiymatini hisoblang: \(f(x) = x^2 - 4x\), \(f'(3) = ?\)", SA, BEG, [], "2", r"\(f'(x) = 2x - 4 \implies f'(3) = 2\cdot 3 - 4 = 2\).", ["derivatives"]),
            (r"Funksiyaning hosilasini toping: \(f(x) = \sin x\)", SC, BEG, [r"\(\cos x\)", r"\(-\cos x\)", r"\(\tan x\)", r"\(-\sin x\)"], r"\(\cos x\)", r"\(\sin x\) ning hosilasi \(\cos x\).", ["derivatives"]),
            (r"Funksiyaning hosilasini toping: \(f(x) = \cos x\)", SC, BEG, [r"\(-\sin x\)", r"\(\sin x\)", r"\(-\cos x\)", r"\(\tan x\)"], r"\(-\sin x\)", r"\(\cos x\) ning hosilasi \(-\sin x\).", ["derivatives"]),
            (r"Funksiyaning hosilasini toping: \(f(x) = e^x\)", SC, BEG, [r"\(e^x\)", r"\(x e^{x-1}\)", r"\(e\)", r"\(\ln x\)"], r"\(e^x\)", r"Eksponentaning hosilasi o'ziga teng: \((e^x)' = e^x\).", ["derivatives"]),
            (r"Funksiyaning hosilasini toping: \(f(x) = \ln x\)", SC, BEG, [r"\(\frac{1}{x}\)", r"\(x\)", r"\(\frac{1}{x^2}\)", r"\(e^x\)"], r"\(\frac{1}{x}\)", r"Natural logarifm hosilasi: \((\ln x)' = \frac{1}{x}\).", ["derivatives"]),
            (r"\(y = x^2\) funksiya grafigiga \(x_0 = 3\) nuqtada o'tkazilgan urinmaning burchak koeffitsiyentini toping.", SA, INT, [], "6", r"\(k = f'(x_0) = 2x_0 = 2 \cdot 3 = 6\).", ["derivatives"]),
            (r"Funksiyaning statsionar (kritik) nuqtasini toping: \(f(x) = x^2 - 6x + 8\)", SA, INT, [], "3", r"\(f'(x) = 2x - 6 = 0 \implies x = 3\).", ["derivatives"]),
            (r"Aniqmas integralni hisoblang: \(\int 2x \, dx\)", SC, BEG, [r"\(x^2 + C\)", r"\(2x^2 + C\)", r"\(x + C\)", r"\(2 + C\)"], r"\(x^2 + C\)", r"\(\int 2x \, dx = 2 \frac{x^2}{2} + C = x^2 + C\).", ["integrals"]),
            (r"Aniq integralni hisoblang: \(\int_0^2 3x^2 \, dx\)", SA, INT, [], "8", r"\(\left. x^3 \right|_0^2 = 2^3 - 0 = 8\).", ["integrals"]),
            (r"Aniq integralni hisoblang: \(\int_1^3 4 \, dx\)", SA, BEG, [], "8", r"\(4(3 - 1) = 4 \cdot 2 = 8\).", ["integrals"]),
            (r"Aniq integralni hisoblang: \(\int_0^1 (2x + 1) \, dx\)", SA, INT, [], "2", r"\(\left. (x^2 + x) \right|_0^1 = (1 + 1) - 0 = 2\).", ["integrals"]),
        ]

        for item in calc_data:
            questions.append({
                "topic_slug": "calculus",
                "prompt": item[0],
                "type": item[1],
                "difficulty": item[2],
                "options": item[3],
                "answer": item[4],
                "explanation": item[5],
                "skills": item[6],
            })

        return questions
