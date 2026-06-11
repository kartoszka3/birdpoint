from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MapObjectViewSet, MapObjectImageViewSet, map_view, recommend_view, test_rekomendacji

router = DefaultRouter()
router.register(r'objects', MapObjectViewSet)
router.register(r'images', MapObjectImageViewSet)

urlpatterns = [
    path('', map_view, name='map'),
    path('api/', include(router.urls)),
    path('recommend/test', test_rekomendacji, name='test_rekomendacji'),
    path('recommend', recommend_view, name='recommend_analysis'),
]

