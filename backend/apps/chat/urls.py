"""
URL routing for Chat app
"""
from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # Messages
    path('messages/', views.MessageListView.as_view(), name='message_list'),
    path('messages/send/', views.SendMessageView.as_view(), name='send_message'),
    path('messages/<int:pk>/read/', views.MarkMessageReadView.as_view(), name='mark_read'),
    path('messages/unread/', views.UnreadMessagesView.as_view(), name='unread_messages'),
    path('conversations/', views.ConversationListView.as_view(), name='conversations'),

    # Chat rooms
    path('rooms/', views.ChatRoomListView.as_view(), name='room_list'),
    path('rooms/create/', views.ChatRoomCreateView.as_view(), name='room_create'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='room_detail'),

    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/create/', views.NotificationCreateView.as_view(), name='notification_create'),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/read-all/', views.MarkAllNotificationsReadView.as_view(), name='mark_all_read'),
]
