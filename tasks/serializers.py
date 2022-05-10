from rest_framework import serializers
from .models import Task
from .task_parsing import date_format, get_due_datetime
from django.contrib.auth.models import User


def get_date(this, obj):
    return obj.created.strftime(date_format)


def get_due_date(this, obj):
    try:
        return obj.due_date.strftime(date_format)
    except:
        return None


class TaskSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    lists = serializers.ListField(child=serializers.CharField())
    tags = serializers.ListField(child=serializers.CharField())
    date = serializers.SerializerMethodField()
    due_date = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'text', 'created', 'user', 'lists', 'tags', 'date', 'status',
            'due_date',
        ]

    def get_date(self, obj):
        return get_date(self, obj)

    def get_due_date(self, obj):
        return get_due_date(self, obj)


# class FilterSerializer(serializers.Serializer):
#     id = serializers.IntegerField()
#     text = serializers.CharField()
#     created = serializers.DateTimeField()
#     user = serializers.ReadOnlyField(source='user.username')
#     lists = serializers.ListField(child=serializers.CharField())
#     tags = serializers.ListField(child=serializers.CharField())
#     date = serializers.SerializerMethodField()
#     status = serializers.CharField(source='get_status_display')
#     due_date = serializers.SerializerMethodField()

#     def get_date(self, obj):
#         return get_date(self, obj)

#     def get_due_date(self, obj):
#         return get_due_date(self, obj)
