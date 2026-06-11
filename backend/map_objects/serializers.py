from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import MapObject, MapObjectImage
from django.conf import settings
from django.contrib.gis.geos import Point
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError


class FlexibleURLField(serializers.URLField):
    """Custom URL field that converts invalid URLs or empty strings to None"""
    def to_internal_value(self, data):
        if data == '' or data is None:
            return None
        
        try:
            return super().to_internal_value(data)
        except serializers.ValidationError:
            # If the URL is invalid, return None instead of raising an error
            return None


class MapObjectImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MapObjectImage
        fields = ('id', 'image_url', 'image')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

class MapObjectSerializer(GeoFeatureModelSerializer):
    # Dodajemy pole, żeby frontend wiedział, czyj to obiekt (tylko do odczytu)
    owner_username = serializers.ReadOnlyField(source='owner.username')
    owner_id = serializers.ReadOnlyField(source='owner.id')
    images = serializers.SerializerMethodField()
    # Use custom URL field that handles invalid URLs gracefully
    video_link = FlexibleURLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = MapObject
        # To pole wskazuje, która zmienna przechowuje geometrię
        geo_field = "location"
        # Te pola trafią do sekcji "properties" w GeoJSON
        fields = ('id', 'name', 'description', 'status', 'video_link', 'owner_username', 'owner_id', 'created_at', 'images')

    def get_images(self, obj):
        request = self.context.get('request')
        imgs = []
        for img in getattr(obj, 'images').all():
            if img.image:
                url = request.build_absolute_uri(img.image.url) if request else img.image.url
                imgs.append(url)
        return imgs

    def to_representation(self, instance):
        """Convert the model instance to GeoJSON with proper geometry format"""
        data = super().to_representation(instance)
        
        # Ensure geometry is in proper GeoJSON format
        if instance.location:
            coords = instance.location.coords
            data['geometry'] = {
                'type': 'Point',
                'coordinates': [coords[0], coords[1]]
            }
        
        return data

    def create(self, validated_data):
        # Jeśli otrzymaliśmy geojson jako słownik w 'location', zamieniamy
        # na obiekt GEOS Point zanim stworzymy instancję modelu.
        loc = validated_data.get('location')
        if isinstance(loc, dict):
            coords = loc.get('coordinates')
            if coords and len(coords) >= 2:
                lng, lat = coords[0], coords[1]
                validated_data['location'] = Point(lng, lat, srid=4326)
        
        # Obsługa video_link - jeśli jest pusty string, ustaw na None
        if 'video_link' in validated_data:
            if validated_data['video_link'] == '':
                validated_data['video_link'] = None
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Jeśli otrzymaliśmy geojson jako słownik w 'location', zamieniamy
        # na obiekt GEOS Point zanim zaktualizujemy instancję modelu.
        loc = validated_data.get('location')
        if isinstance(loc, dict):
            coords = loc.get('coordinates')
            if coords and len(coords) >= 2:
                lng, lat = coords[0], coords[1]
                validated_data['location'] = Point(lng, lat, srid=4326)
        
        # Obsługa video_link - jeśli jest pusty string, nie zmieniaj istniejącą wartość
        # Jeśli jest podany URL, zaktualizuj
        if 'video_link' in validated_data:
            if validated_data['video_link'] == '':
                # Usuń z validated_data - nie zmieniaj istniejącą wartość
                del validated_data['video_link']
        
        return super().update(instance, validated_data)