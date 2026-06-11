from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MapObjectViewSet, MapObjectImageViewSet, map_view

router = DefaultRouter()
router.register(r'objects', MapObjectViewSet)
router.register(r'images', MapObjectImageViewSet)

urlpatterns = [
    path('', map_view, name='map'),
    path('api/', include(router.urls)),
]