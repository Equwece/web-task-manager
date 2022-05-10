from django.urls import path
from tasks import views

urlpatterns = [
    path(
        'api/user/<str:user>/',
        views.TaskList.as_view(),
        name='get_all_tasks'
    ),
    path(
        'api/user/<str:user>/<int:pk>/',
        views.TaskDetail.as_view(),
        name='get_detail_task'
    ),
    path('api/user/<str:user>/export/', views.export, name='export'),
    path('api/user/<str:user>/import/', views.upload, name='upload'),
    path('api/whoami/', views.Whoami.as_view(), name='whoami'),
    path('api/login/', views.login_api, name='login_api'),
    path(
        'api/user/<str:user>/filter/', views.filter_query, name='filter_query'
    ),
    path('', views.editor, name='editor'),
    path('login/', views.FormLogin.as_view(), name='login_form'),
    path('register/', views.Register.as_view(), name='register_form'),
    path('logout/', views.logout_user, name='logout'),
    path('home/', views.home, name='home'),
    path('blog/', views.blog, name='blog'),
    path('about/', views.about, name='about'),
]
