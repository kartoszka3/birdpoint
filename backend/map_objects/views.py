from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.views.static import serve
from django.conf import settings
from .models import MapObject, MapObjectImage
from .serializers import MapObjectSerializer
from .permissions import IsOwnerOrReadOnly
import json
import logging

logger = logging.getLogger(__name__)

class MapObjectViewSet(viewsets.ModelViewSet):
    queryset = MapObject.objects.all()
    serializer_class = MapObjectSerializer

    # Lista obiektów dostępna dla wszystkich, edycja/dodawanie dla zalogowanych + sprawdzanie właściciela
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    # Nadpisujemy metodę zapisu, aby automatycznie przypisać twórcę obiektu
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        """Handle creation with optional image uploads"""
        logger.warning(f"Create request - data keys: {request.data.keys()}")
        logger.warning(f"Create request - files: {request.FILES.keys()}")
        
        # Check if we have multipart data with images
        if 'feature' in request.data:
            # Parse feature from form data
            try:
                feature = json.loads(request.data.get('feature'))
            except (json.JSONDecodeError, TypeError):
                return Response(
                    {'error': 'Invalid feature JSON'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create GeoJSON-like request data for serializer
            request_data = feature
        else:
            # Standard JSON request
            request_data = request.data
        
        serializer = self.get_serializer(data=request_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Handle image uploads if present
        feeder = serializer.instance
        image_files = request.FILES.getlist('images')
        logger.warning(f"Image files received: {len(image_files)}")
        
        for image_file in image_files:
            logger.warning(f"Creating MapObjectImage for {image_file.name}")
            MapObjectImage.objects.create(
                map_object=feeder,
                image=image_file
            )
        
        # Re-serialize with images after creating them
        serializer = self.get_serializer(feeder)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        logger.warning(f"MapObject list response type: {type(response.data)}, keys: {list(response.data.keys()) if isinstance(response.data, dict) else 'N/A'}")
        logger.warning(f"MapObject list response data (first 500 chars): {str(response.data)[:500]}")
        return response

def map_view(request):
    return serve(request, 'index.html', document_root=settings.STATIC_ROOT)