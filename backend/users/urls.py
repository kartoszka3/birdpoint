from django.urls import path
from .views import RegisterView, LoginView, ProfileView, UsersListView, AvatarUploadView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('list/', UsersListView.as_view(), name='users-list'),
    path('avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
]