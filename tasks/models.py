from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone


class Task(models.Model):
    TASK_STATUS = [
        ('active', 'active'),
        ('done', 'done'),
    ]
    text = models.TextField()
    created = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    tags = ArrayField(models.TextField(), null=True)
    lists = ArrayField(models.TextField(), null=True)
    status = models.CharField(
        default='active',
        max_length=6,
        choices=TASK_STATUS,
    )
    due_date = models.DateTimeField(null=True)

    class Meta:
        ordering = ['text']
