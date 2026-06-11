from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.views.static import serve
from django.conf import settings
from .models import MapObject, MapObjectImage
from .serializers import MapObjectSerializer, MapObjectImageSerializer
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
                logger.warning(f"Create - parsed feature: {feature}")
                # Rozpakuj properties i połącz z geometry (mapując na location)
                properties = feature.get('properties', {})
                request_data = {
                    **properties,  # Rozpakuj wszystkie properties (name, description, status, video_link, etc.)
                    'location': feature.get('geometry')  # Mapuj geometry na location dla serializer
                }
                logger.warning(f"Create - request_data keys: {request_data.keys()}, video_link: {request_data.get('video_link')}")
            except (json.JSONDecodeError, TypeError):
                return Response(
                    {'error': 'Invalid feature JSON'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Standard JSON request
            request_data = request.data
            logger.warning(f"Create - request_data keys: {request_data.keys()}")
        
        logger.warning(f"Create - serializer will receive: {request_data}")
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

    def update(self, request, *args, **kwargs):
        """Handle update with optional image uploads"""
        logger.warning(f"Update request - data keys: {request.data.keys()}")
        logger.warning(f"Update request - files: {request.FILES.keys()}")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Parse feature data
        if 'feature' in request.data:
            try:
                feature = json.loads(request.data.get('feature'))
                logger.warning(f"Update - parsed feature: {feature}")
                # Rozpakuj properties i połącz z geometry (mapując na location)
                properties = feature.get('properties', {})
                request_data = {
                    **properties,  # Rozpakuj wszystkie properties
                    'location': feature.get('geometry')  # Mapuj geometry na location
                }
                logger.warning(f"Update - request_data keys: {request_data.keys()}, video_link: {request_data.get('video_link')}")
            except (json.JSONDecodeError, TypeError):
                return Response(
                    {'error': 'Invalid feature JSON'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            request_data = request.data
            logger.warning(f"Update - standard JSON, video_link: {request_data.get('video_link')}")
        
        serializer = self.get_serializer(instance, data=request_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Handle image uploads if present (add new images, keep old ones)
        image_files = request.FILES.getlist('images')
        if image_files:
            logger.warning(f"Image files received for update: {len(image_files)}")
            for image_file in image_files:
                logger.warning(f"Creating MapObjectImage for {image_file.name}")
                MapObjectImage.objects.create(
                    map_object=instance,
                    image=image_file
                )
        
        # Re-serialize with images after updating
        serializer = self.get_serializer(instance)
        
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        logger.warning(f"MapObject list response type: {type(response.data)}, keys: {list(response.data.keys()) if isinstance(response.data, dict) else 'N/A'}")
        logger.warning(f"MapObject list response data (first 500 chars): {str(response.data)[:500]}")
        return response


class MapObjectImageViewSet(viewsets.ModelViewSet):
    queryset = MapObjectImage.objects.all()
    serializer_class = MapObjectImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        # Filtruj po map_object jeśli parametr jest podany
        queryset = MapObjectImage.objects.all()
        map_object_id = self.request.query_params.get('map_object', None)
        if map_object_id is not None:
            queryset = queryset.filter(map_object_id=map_object_id)
        return queryset

    def get_permissions(self):
        """
        Uprawnienia: odczyt dla wszystkich, zapis/usuwanie tylko dla właściciela obiektu
        """
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsOwnerOrReadOnly()]

    def check_object_permissions(self, request, obj):
        """
        Sprawdź czy użytkownik jest właścicielem MapObject powiązanego z obrazem
        """
        # Dla metod safe (GET) zezwalamy wszystkim
        if request.method in permissions.SAFE_METHODS:
            return
        
        # Dla DELETE, PUT, PATCH - sprawdź czy użytkownik jest właścicielem obiektu
        if request.user and obj.map_object.owner == request.user:
            return
        
        self.permission_denied(request)


def map_view(request):
    return serve(request, 'index.html', document_root=settings.STATIC_ROOT)