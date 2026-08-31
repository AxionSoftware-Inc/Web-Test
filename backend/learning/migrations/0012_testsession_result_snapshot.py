from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0011_performance_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="testsession",
            name="result_snapshot",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
