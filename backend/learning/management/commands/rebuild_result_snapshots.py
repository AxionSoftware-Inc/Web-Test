from django.core.management.base import BaseCommand

from learning.models import TestSession
from learning.services.scoring import build_session_result


class Command(BaseCommand):
    help = "Build immutable result snapshots for submitted sessions that do not have one."

    def add_arguments(self, parser):
        parser.add_argument("--batch-size", type=int, default=100)

    def handle(self, *args, **options):
        batch_size = max(1, options["batch_size"])
        sessions = (
            TestSession.objects.filter(status=TestSession.Status.SUBMITTED, result_snapshot__isnull=True)
            .select_related("test")
            .prefetch_related("answers", "test__testquestion_set__question__skills")
            .order_by("id")
        )
        rebuilt = 0
        for session in sessions.iterator(chunk_size=batch_size):
            session.result_snapshot = build_session_result(session)
            session.save(update_fields=["result_snapshot", "updated_at"])
            rebuilt += 1
        self.stdout.write(self.style.SUCCESS(f"Rebuilt {rebuilt} result snapshot(s)."))
