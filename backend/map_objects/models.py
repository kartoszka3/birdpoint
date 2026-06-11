from django.contrib.gis.db import models
from django.conf import settings

class MapObject(models.Model):
    STATUS_CHOICES = [
        ('UNDER_CARE', 'Pod opieką'),
        ('WITHOUT_CARE', 'Bez opieki'),
    ]

    # Atrybuty obowiązkowe i opcjonalne
    name = models.CharField(max_length=150, verbose_name="Nazwa obiektu")
    description = models.TextField(blank=True, null=True, verbose_name="Opis/Atrybuty dodatkowe")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='WITHOUT_CARE')
    
    # Geometria punktowa (WGS 84 - standardowy system GPS)
    location = models.PointField(srid=4326, verbose_name="Lokalizacja")
    
    # Relacja do użytkownika, niezbędna do weryfikacji uprawnień
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='map_objects')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"


class MapObjectImage(models.Model):
    map_object = models.ForeignKey(MapObject, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='feeders/')

    def __str__(self):
        return f"Image for {self.map_object_id}"