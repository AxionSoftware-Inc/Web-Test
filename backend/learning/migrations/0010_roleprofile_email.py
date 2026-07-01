from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0009_roleprofile_phone"),
    ]

    operations = [
        migrations.AddField(
            model_name="roleprofile",
            name="email",
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]
