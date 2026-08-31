from rest_framework.test import APITestCase

from learning.models import AuditEvent, Question, Skill, Subject, Test, TestQuestion, Topic


class LearningApiContractTests(APITestCase):
    def setUp(self):
        self.subject = Subject.objects.create(title="Mathematics", slug="mathematics")
        self.topic = Topic.objects.create(subject=self.subject, title="Algebra", slug="algebra")
        self.skill = Skill.objects.create(topic=self.topic, title="Linear equations", slug="linear-equations")
        self.question = Question.objects.create(
            subject=self.subject,
            topic=self.topic,
            type=Question.QuestionType.SINGLE_CHOICE,
            difficulty=Question.Difficulty.BEGINNER,
            prompt="2 + 2 = ?",
            options=["3", "4"],
            answer="4",
            explanation="Add the two numbers.",
        )
        self.question.skills.add(self.skill)
        self.test = Test.objects.create(
            title="Algebra smoke test",
            slug="algebra-smoke-test",
            subject=self.subject,
            topic=self.topic,
            difficulty=Question.Difficulty.BEGINNER,
            status=Test.PublishStatus.PUBLISHED,
        )
        TestQuestion.objects.create(test=self.test, question=self.question, order=1)

    def test_public_test_and_question_contract_does_not_leak_solutions(self):
        list_response = self.client.get("/api/tests/?page_size=10")
        test_response = self.client.get("/api/tests/algebra-smoke-test/")
        question_response = self.client.get(f"/api/questions/{self.question.id}/")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["count"], 1)
        self.assertEqual(test_response.status_code, 200)
        public_question = test_response.data["test_questions"][0]["question"]
        self.assertNotIn("answer", public_question)
        self.assertNotIn("explanation", public_question)
        self.assertNotIn("answer", question_response.data)
        self.assertNotIn("explanation", question_response.data)

    def test_solution_endpoint_is_explicit_and_result_is_server_scored(self):
        solution_response = self.client.get(f"/api/questions/{self.question.id}/solution/")
        self.assertEqual(solution_response.status_code, 200)
        self.assertEqual(solution_response.data["answer"], "4")

        direct_session_create = self.client.post(
            "/api/sessions/",
            {"test": self.test.id, "student_name": "Not allowed", "student_code": "direct"},
            format="json",
        )
        self.assertEqual(direct_session_create.status_code, 405)

        start_response = self.client.post(
            "/api/tests/algebra-smoke-test/start/",
            {"student_name": "Student", "student_code": "student-1"},
            format="json",
        )
        self.assertEqual(start_response.status_code, 201)
        session_id = start_response.data["id"]

        answer_response = self.client.post(
            f"/api/sessions/{session_id}/answer/",
            {"question": self.question.id, "value": "4"},
            format="json",
        )
        self.assertEqual(answer_response.status_code, 200)
        submit_response = self.client.post(f"/api/sessions/{session_id}/submit/", format="json")
        self.assertEqual(submit_response.status_code, 200)
        self.assertTrue(AuditEvent.objects.filter(action="session.submitted", resource_id=str(session_id)).exists())

        result_response = self.client.get(f"/api/sessions/{session_id}/result/")
        self.assertEqual(result_response.status_code, 200)
        self.assertEqual(result_response.data["scoring_version"], 1)
        self.assertEqual(result_response.data["summary"]["score"], 100)
        self.assertTrue(result_response.data["questions"][0]["is_correct"])
        self.assertIsNotNone(submit_response.data.get("id"))

        self.question.answer = "3"
        self.question.save(update_fields=["answer", "updated_at"])
        unchanged_result = self.client.get(f"/api/sessions/{session_id}/result/")
        self.assertEqual(unchanged_result.data["summary"]["score"], 100)
        self.assertEqual(unchanged_result.data["questions"][0]["question"]["answer"], "4")

        locked_response = self.client.post(
            f"/api/sessions/{session_id}/answer/",
            {"question": self.question.id, "value": "3"},
            format="json",
        )
        self.assertEqual(locked_response.status_code, 400)

    def test_health_endpoint_reports_database(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"status": "ok", "database": "ok"})

    def test_multiple_choice_scoring_is_shared_with_profile_and_mistakes(self):
        self.question.type = Question.QuestionType.MULTIPLE_CHOICE
        self.question.options = ["A", "B", "C"]
        self.question.answer = "A, B"
        self.question.save(update_fields=["type", "options", "answer", "updated_at"])

        start_response = self.client.post(
            "/api/tests/algebra-smoke-test/start/",
            {"student_name": "Student", "student_code": "student-multi"},
            format="json",
        )
        session_id = start_response.data["id"]
        answer_response = self.client.post(
            f"/api/sessions/{session_id}/answer/",
            {"question": self.question.id, "value": " B, A "},
            format="json",
        )
        self.assertEqual(answer_response.status_code, 200)
        submit_response = self.client.post(f"/api/sessions/{session_id}/submit/", format="json")
        self.assertEqual(submit_response.status_code, 200)

        result_response = self.client.get(f"/api/sessions/{session_id}/result/")
        profile_response = self.client.get("/api/profile/summary/?student_code=student-multi")
        mistakes_response = self.client.get("/api/mistakes/summary/?student_code=student-multi")

        self.assertEqual(result_response.data["summary"]["score"], 100)
        self.assertTrue(result_response.data["questions"][0]["is_correct"])
        self.assertEqual(profile_response.data["average_score"], 100)
        self.assertEqual(mistakes_response.data["mistakes"], [])

    def test_mastery_endpoint_builds_skill_gaps_and_updates_across_attempts(self):
        differentiation = Skill.objects.create(topic=self.topic, title="Differentiation", slug="differentiation")
        questions = [
            self.question,
            Question.objects.create(
                subject=self.subject,
                topic=self.topic,
                type=Question.QuestionType.SINGLE_CHOICE,
                difficulty=Question.Difficulty.BEGINNER,
                prompt="3 + 3 = ?",
                options=["5", "6"],
                answer="6",
            ),
            Question.objects.create(
                subject=self.subject,
                topic=self.topic,
                type=Question.QuestionType.SINGLE_CHOICE,
                difficulty=Question.Difficulty.INTERMEDIATE,
                prompt="Derivative of x² = ?",
                options=["x", "2x"],
                answer="2x",
            ),
            Question.objects.create(
                subject=self.subject,
                topic=self.topic,
                type=Question.QuestionType.SINGLE_CHOICE,
                difficulty=Question.Difficulty.INTERMEDIATE,
                prompt="Derivative of x³ = ?",
                options=["3x²", "x²"],
                answer="3x²",
            ),
        ]
        questions[1].skills.add(self.skill)
        questions[2].skills.add(differentiation)
        questions[3].skills.add(differentiation)
        for order, question in enumerate(questions[1:], start=2):
            TestQuestion.objects.create(test=self.test, question=question, order=order)

        def submit(values):
            start = self.client.post(
                "/api/tests/algebra-smoke-test/start/",
                {"student_name": "Student", "student_code": "mastery-student"},
                format="json",
            )
            self.assertEqual(start.status_code, 201)
            session_id = start.data["id"]
            for question, value in zip(questions, values):
                answer = self.client.post(
                    f"/api/sessions/{session_id}/answer/",
                    {"question": question.id, "value": value},
                    format="json",
                )
                self.assertEqual(answer.status_code, 200)
            submitted = self.client.post(f"/api/sessions/{session_id}/submit/", format="json")
            self.assertEqual(submitted.status_code, 200)

        submit(["4", "wrong", "wrong", "wrong"])
        first = self.client.get("/api/profile/mastery/?student_code=mastery-student")
        self.assertEqual(first.status_code, 200)
        first_skills = {item["skill"]: item for item in first.data["skills"]}
        self.assertEqual(first.data["overview"]["questions_attempted"], 4)
        self.assertEqual(first_skills["Linear equations"]["accuracy"], 50)
        self.assertEqual(first_skills["Differentiation"]["accuracy"], 0)
        self.assertEqual(first.data["recommendations"][0]["skill"], "Differentiation")
        self.assertEqual(first.data["recommendations"][0]["type"], "practice")

        submit(["4", "6", "2x", "3x²"])
        second = self.client.get("/api/profile/mastery/?student_code=mastery-student")
        second_skills = {item["skill"]: item for item in second.data["skills"]}
        self.assertEqual(second.data["overview"]["tests_taken"], 2)
        self.assertEqual(second_skills["Differentiation"]["attempts"], 4)
        self.assertEqual(second_skills["Differentiation"]["correct"], 2)
        self.assertEqual(second_skills["Differentiation"]["mastery"], 38)
        self.assertEqual(second.data["recommendations"][0]["skill"], "Differentiation")

    def test_mastery_requires_a_student_identity(self):
        response = self.client.get("/api/profile/mastery/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("student_code", response.data)

    def test_session_list_can_be_scoped_to_one_student(self):
        first = self.client.post(
            "/api/tests/algebra-smoke-test/start/",
            {"student_name": "First", "student_code": "first-student"},
            format="json",
        )
        second = self.client.post(
            "/api/tests/algebra-smoke-test/start/",
            {"student_name": "Second", "student_code": "second-student"},
            format="json",
        )
        response = self.client.get("/api/sessions/?student_code=first-student")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["student_code"], "first-student")

    def test_import_pack_can_save_a_private_draft(self):
        response = self.client.post(
            "/api/tests/import-pack/",
            {
                "status": "draft",
                "creator_name": "Teacher",
                "source": {
                    "version": "1.0",
                    "pack": {"title": "Draft import pack", "subject": "mathematics", "branch": "algebra", "level": "beginner", "language": "uz"},
                    "tests": [{
                        "title": "Draft algebra test",
                        "topic": "algebra",
                        "questions": [{
                            "type": "single_choice",
                            "body": "1 + 1 = ?",
                            "options": [{"id": "A", "text": "2"}, {"id": "B", "text": "3"}],
                            "answer": {"correct": "A"},
                            "skills": ["addition"],
                        }],
                    }],
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["tests"][0]["status"], Test.PublishStatus.DRAFT)

    def test_import_pack_rejects_unbounded_payloads_before_creating_data(self):
        response = self.client.post(
            "/api/tests/import-pack/",
            {
                "source": {
                    "version": "1.0",
                    "pack": {"title": "Too many tests", "subject": "mathematics", "branch": "algebra", "level": "beginner", "language": "uz"},
                    "tests": [{"title": f"Test {index}", "questions": []} for index in range(201)],
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "too_many_tests")
