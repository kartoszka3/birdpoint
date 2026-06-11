from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    # Rejestracja musi być dostępna dla niezalogowanych
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'non_field_errors': ['Please provide both username and password']},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'non_field_errors': ['Invalid username or password']},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'token': token.key
        }, status=status.HTTP_200_OK)

class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    # Dostęp tylko dla zalogowanych
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UsersListView(generics.ListAPIView):
    """Zwraca listę użytkowników; wspiera filtrację po parametrze `q`."""
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def get_queryset(self):
        q = self.request.query_params.get('q', None)
        if q:
            return User.objects.filter(username__icontains=q)
        return User.objects.all()


from rest_framework.parsers import MultiPartParser, FormParser


class AvatarUploadView(APIView):
    """Upload avatar for authenticated user."""
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        avatar_file = request.FILES.get('avatar')
        if not avatar_file:
            return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.avatar.save(avatar_file.name, avatar_file, save=True)
        user.refresh_from_db()  # Refresh to ensure we have latest data
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)