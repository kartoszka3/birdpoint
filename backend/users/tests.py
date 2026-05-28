from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAccountTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.profile_url = reverse('profile')
        
        self.test_user_data = {
            'username': 'wolontariusz_krzychu',
            'email': 'chris@birdpoint.pl',
            'password': '1do9'
        }

    def test_user_registration(self):
        """Sprawdza, czy endpoint rejestracji poprawnie tworzy nowego użytkownika w bazie."""
        response = self.client.post(self.register_url, self.test_user_data)
        
        # Oczekujemy kodu 201 (Created)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Sprawdzamy, czy w bazie faktycznie jest 1 użytkownik
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'wolontariusz_jan')
        # Upewniamy się, że API nie zwraca w odpowiedzi hasła (kwestia bezpieczeństwa)
        self.assertNotIn('password', response.data)

    def test_user_login_and_token_generation(self):
        """Sprawdza, czy poprawne logowanie zwraca token autoryzacyjny."""
        # Najpierw ręcznie tworzymy użytkownika w testowej bazie
        User.objects.create_user(**self.test_user_data)
        
        # Próbujemy się zalogować
        login_data = {
            'username': 'wolontariusz_jan',
            'password': 'SuperTajneHaslo123'
        }
        response = self.client.post(self.login_url, login_data)
        
        # Oczekujemy kodu 200 (OK) oraz obecności klucza 'token' w odpowiedzi JSON
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_profile_access_with_token(self):
        """Sprawdza, czy zalogowany użytkownik ma dostęp do endpointu /profile/."""
        user = User.objects.create_user(**self.test_user_data)
        
        # Symulujemy nagłówek 'Authorization: Token <token>'
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'wolontariusz_jan')
        # Sprawdzamy czy zwraca join_date (wymaganie personalizacji)
        self.assertIn('join_date', response.data)

    def test_profile_access_denied_for_anonymous(self):
        """Sprawdza, czy anonimowy użytkownik zostanie odrzucony przy próbie wejścia na profil."""
        response = self.client.get(self.profile_url)
        
        # Oczekujemy kodu 401 (Unauthorized)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)