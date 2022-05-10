import io
import json
from django.utils import timezone
from django.shortcuts import render, redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Task
from .serializers import TaskSerializer, date_format
from .forms import LoginForm, RegisterForm, UploadFileForm
from .task_parsing import get_datetime, get_mark_words, get_due_datetime
from django.http import Http404, HttpResponse
from django.views import View
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST

class TaskList(APIView):
    def get(self, request, user, format=None):
        try:
            tasks = User.objects.get(
                username__iexact=user.lower()
            ).task_set.all()
        except User.DoesNotExist:
            raise Http404
        serialized_tasks = TaskSerializer(tasks, many=True)
        return Response(serialized_tasks.data)

    def post(self, request, user, format=None):
        serialized_tasks = TaskSerializer(data=request.data)
        if serialized_tasks.is_valid():
            due_date = get_due_datetime(request.data['text'])
            serialized_tasks.save(
                user=self.request.user,
                due_date=due_date,
            )
            return Response(serialized_tasks.data,
                            status=status.HTTP_201_CREATED)
        return Response(serialized_tasks.errors,
                        status=status.HTTP_400_BAD_REQUEST)


class TaskDetail(APIView):
    def get_object(self, pk, user):
        try:
            task = User.objects.get(
                username__iexact=user.lower()
            ).task_set.get(pk=pk)
            return task
        except Task.DoesNotExist:
            raise Http404

    def get(self, request, user, pk, format=None):
        task = self.get_object(pk, user)
        serialized_task = TaskSerializer(task)
        return Response(serialized_task.data)

    def put(self, request, user, pk, format=None):
        task = self.get_object(pk, user)
        serialized_task = TaskSerializer(task, data=request.data)
        if serialized_task.is_valid():
            due_date = get_due_datetime(request.data['text'])
            serialized_task.save(
                due_date=due_date,
            )
            return Response(serialized_task.data)
        return Response(serialized_task.errors,
                        status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user, pk, format=None):
        task = self.get_object(pk, user)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@login_required
def editor(request):
    upload_form = UploadFileForm()
    return render(request, 'tasks/editor.html', {
        'editor': 1,
        'user': request.user,
        'upload_form': upload_form,
    })


class FormLogin(View):
    def get(self, request):
        form = LoginForm()
        context = {
            'form': form,
        }
        return render(request, 'tasks/form_login.html', context)

    def post(self, request):
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(password=password, username=username)
            if user is not None:
                login(request, user)
                return redirect('editor')
            else:
                messages.error(request, 'Login data is incorrect')
        return self.get(request)


class Register(View):
    def get(self, request):
        form = RegisterForm()
        context = {
            'form': form,
        }
        return render(request, 'tasks/register_form.html', context)

    def post(self, request):
        form = RegisterForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            new_user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            new_user.save()
            return redirect('editor')
        else:
            messages.error(request, 'Data is incorrect')
            return self.get(request)


def logout_user(request):
    logout(request)
    return redirect('login_form')


def home(request):
    return render(request, 'tasks/home.html')


def about(request):
    return render(request, 'tasks/about.html')


def blog(request):
    return render(request, 'tasks/blog.html')


class Whoami(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response({'username': request.user.username})
        else:
            return Response({'username': 'None'})
    # return Response({
    #     'username': request.user.username,
    # })


@require_POST
def login_api(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')

    if username is None or password is None:
        return JsonResponse({
            'detail': 'Please provide username and password.'
        }, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        return JsonResponse({'detail': 'Invalid credentials.'}, status=400)

    login(request, user)
    return JsonResponse({'detail': 'Successfully logged in.'})


def filter_query(request, user):
    SORTING_TYPES = {
        'Title': 'text',
        'Creation date': 'created',
        'Due date': 'due_date',
    }
    sort = 'text'
    data = json.loads(request.body)
    if 'tag' in data.keys():
        tags = data['tag']
    else:
        tags = []
    if 'list' in data.keys():
        lists = data['list']
    else:
        lists = []
    if 'search' in data.keys():
        search = data['search']
    else:
        search = ''
    if 'sort' in data.keys():
        if 'type' in data['sort'] and data['sort']['type'] in SORTING_TYPES:
            sort = SORTING_TYPES[data['sort']['type']]
            if 'reversed' in data['sort'] and data['sort']['reversed']:
                sort = '-' + sort

    tasks = User.objects.get(
        username__iexact=user.lower()
    ).task_set.all()

    if 'None' in tags:
        tags.remove('None')
        tasks = tasks.filter(tags__exact=[])
    if 'None' in lists:
        lists.remove('None')
        tasks = tasks.filter(lists__exact=[])

    tasks = tasks.filter(
        tags__contains=tags, lists__contains=lists, text__icontains=search,
    )

    tasks = tasks.order_by('status', sort, 'text')
    serialized_tasks = TaskSerializer(tasks, many=True).data
    return JsonResponse(dict({'tasks': serialized_tasks}))


@login_required
def export(request, user):
    todotxt = io.StringIO()
    tasks = User.objects.get(
        username__iexact=user.lower()
    ).task_set.all()
    for i, task in enumerate(tasks):
        todotxt.write(
            f'{"x " if task.status == "done" else ""}'
            f'{task.created.strftime(date_format)} '
            f'{task.text}'
        )
        if i < len(tasks) - 1:
            todotxt.write('\n')
    response = HttpResponse(todotxt.getvalue(), content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename=todo.txt'
    todotxt.close()
    return response


@login_required
@require_POST
def upload(request, user):
    form = UploadFileForm(request.POST, request.FILES)
    if form.is_valid():
        todotxt = request.FILES['file']
        if todotxt.size < 10000:
            try:
                tasks = User.objects.get(
                    username__iexact=user.lower()
                ).task_set.all()
                for task in tasks:
                    task.delete()
                tasks = ''
                for chunk in todotxt.chunks():
                    tasks += chunk.decode('utf8')
                tasks = tasks.split('\n')
                # tasks = tasks[:len(tasks) - 1]
                for task in tasks:
                    if task[:2] == 'x ':
                        status = 'done'
                        task = task.replace('x ', '', 1)
                    else:
                        status = 'active'
                    dt = get_datetime(task)
                    if not dt:
                        dt = timezone.now()
                    else:
                        task = task.replace(dt.strftime(date_format), '')
                        task = task.strip()
                    due_date = get_due_datetime(task)
                    lists = get_mark_words(task, '@')
                    tags = get_mark_words(task, '+')
                    user = request.user
                    new_task = Task(
                        text=task,
                        created=dt,
                        user=user,
                        tags=tags,
                        lists=lists,
                        status=status,
                        due_date=due_date,
                    )
                    new_task.save()
            except:
                messages.error(request, 'Task parsing error')
        else:
            messages.error(request, 'File is too large')
    return redirect('editor')
