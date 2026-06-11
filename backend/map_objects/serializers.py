from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import MapObject
from django.conf import settings


class MapObjectImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = None  # set dynamically below
        fields = ('id', 'image_url')

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url
from django.contrib.gis.geos import Point

class MapObjectSerializer(GeoFeatureModelSerializer):
    # Dodajemy pole, żeby frontend wiedział, czyj to obiekt (tylko do odczytu)
    owner_username = serializers.ReadOnlyField(source='owner.username')
    owner_id = serializers.ReadOnlyField(source='owner.id')
    images = serializers.SerializerMethodField()

    class Meta:
        model = MapObject
        # To pole wskazuje, która zmienna przechowuje geometrię
        geo_field = "location"
        # Te pola trafią do sekcji "properties" w GeoJSON
        fields = ('id', 'name', 'description', 'status', 'owner_username', 'owner_id', 'created_at', 'images')

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
        return super().create(validated_data)