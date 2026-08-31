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
