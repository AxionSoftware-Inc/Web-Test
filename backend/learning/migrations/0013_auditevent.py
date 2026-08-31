from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0012_testsession_result_snapshot"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("action", models.CharField(max_length=80)),
                ("resource_type", models.CharField(max_length=80)),
                ("resource_id", models.CharField(max_length=80)),
                ("identity_code", models.CharField(blank=True, max_length=120)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["resource_type", "resource_id", "-created_at"], name="audit_resource_idx"),
                    models.Index(fields=["action", "-created_at"], name="audit_action_idx"),
                ],
            },
        ),
    ]
