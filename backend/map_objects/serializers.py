from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import MapObject

class MapObjectSerializer(GeoFeatureModelSerializer):
    # Dodajemy pole, żeby frontend wiedział, czyj to obiekt (tylko do odczytu)
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = MapObject
        # To pole wskazuje, która zmienna przechowuje geometrię
        geo_field = "location"
        # Te pola trafią do sekcji "properties" w GeoJSON
        fields = ('id', 'name', 'description', 'status', 'owner_username', 'created_at')