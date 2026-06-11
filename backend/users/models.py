from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    join_date = models.DateTimeField(auto_now_add=True)
    avatar = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    def __str__(self):
        return self.username