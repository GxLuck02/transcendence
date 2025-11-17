"""
URL routing for Users app
"""
from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.CurrentUserView.as_view(), name='me'),

    # OAuth 42
    path('oauth/42/', views.OAuth42InitView.as_view(), name='oauth_init'),
    path('oauth/42/callback/', views.OAuth42CallbackView.as_view(), name='oauth_callback'),

    # User management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('stats/', views.UserStatsView.as_view(), name='my_stats'),
    path('stats/<int:pk>/', views.UserStatsView.as_view(), name='user_stats'),

    # Friends
    path('friends/', views.FriendListView.as_view(), name='friends'),
    path('friends/add/<int:user_id>/', views.AddFriendView.as_view(), name='add_friend'),
    path('friends/remove/<int:user_id>/', views.RemoveFriendView.as_view(), name='remove_friend'),

    # Block users
    path('blocked/', views.BlockedUsersListView.as_view(), name='blocked_list'),
    path('block/<int:user_id>/', views.BlockUserView.as_view(), name='block_user'),
    path('unblock/<int:user_id>/', views.UnblockUserView.as_view(), name='unblock_user'),
]
