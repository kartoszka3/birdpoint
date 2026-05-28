from rest_framework import generics, permissions
from .serializers import RegisterSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    # Rejestracja musi być dostępna dla niezalogowanych
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    # Dostęp tylko dla zalogowanych
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user