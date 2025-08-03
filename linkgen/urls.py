from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path("", views.ytlink, name="ytlink"),
    path("process-video/<str:video_id>/", views.process_single_video, name="process_single_video"),
    path("check-remaining-videos/", views.check_remaining_videos, name="check_remaining_videos"),
    path("get-paginated-videos/", views.get_paginated_videos, name="get_paginated_videos"),
]
