from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0010_roleprofile_email"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="test",
            index=models.Index(fields=["topic", "difficulty"], name="test_topic_diff_idx"),
        ),
        migrations.AddIndex(
            model_name="test",
            index=models.Index(fields=["status", "created_at"], name="test_status_created_idx"),
        ),
        migrations.AddIndex(
            model_name="classtestassignment",
            index=models.Index(fields=["classroom", "-created_at"], name="assignment_class_created_idx"),
        ),
        migrations.AddIndex(
            model_name="exampackitem",
            index=models.Index(fields=["pack", "order"], name="pack_item_order_idx"),
        ),
        migrations.AddIndex(
            model_name="testquestion",
            index=models.Index(fields=["test", "order"], name="test_question_order_idx"),
        ),
        migrations.AddIndex(
            model_name="testsession",
            index=models.Index(fields=["classroom", "status", "-submitted_at"], name="session_class_status_idx"),
        ),
        migrations.AddIndex(
            model_name="testsession",
            index=models.Index(fields=["exam_pack", "status", "-submitted_at"], name="session_pack_status_idx"),
        ),
        migrations.AddIndex(
            model_name="testsession",
            index=models.Index(fields=["student_code", "status"], name="session_student_status_idx"),
        ),
    ]
