from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Pozwala na odczyt wszystkim (GET), ale edycję (PUT, PATCH, DELETE) 
    tylko właścicielowi obiektu.
    """
    def has_object_permission(self, request, view, obj):
        # Zapytania typu GET, HEAD, OPTIONS są zawsze dozwolone
        if request.method in permissions.SAFE_METHODS:
            return True
        # Wymagamy, aby użytkownik wykonujący akcję był właścicielem
        return obj.owner == request.user