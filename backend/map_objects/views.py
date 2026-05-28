from rest_framework import viewsets, permissions
from django.views.static import serve
from django.conf import settings
from .models import MapObject
from .serializers import MapObjectSerializer
from .permissions import IsOwnerOrReadOnly

class MapObjectViewSet(viewsets.ModelViewSet):
    queryset = MapObject.objects.all()
    serializer_class = MapObjectSerializer

    # Lista obiektów dostępna dla wszystkich, edycja/dodawanie dla zalogowanych + sprawdzanie właściciela
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    # Nadpisujemy metodę zapisu, aby automatycznie przypisać twórcę obiektu
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

def map_view(request):
    return serve(request, 'index.html', document_root=settings.STATIC_ROOT)