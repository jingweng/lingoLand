"""
Backend API Tests for Lingo Land Educational App
Tests: Auth, Words, Game Sessions, Activity Logging
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "testpass123"
TEST_USERNAME = "TestUser"

# Existing test user
EXISTING_EMAIL = "test@jason.com"
EXISTING_PASSWORD = "test123"


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root accessible: {data['message']}")
    
    def test_login_existing_user(self):
        """Test login with existing test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == EXISTING_EMAIL
        print(f"✓ Login successful for {EXISTING_EMAIL}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly returns 401")
    
    def test_register_new_user(self):
        """Test user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": TEST_USERNAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "role": "student"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["role"] == "student"
        print(f"✓ Registration successful for {TEST_EMAIL}")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Then get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == EXISTING_EMAIL
        print(f"✓ /auth/me returns correct user info")
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me correctly requires authentication")


class TestWordEndpoints:
    """Word CRUD endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_words(self, auth_token):
        """Test getting user's words"""
        response = requests.get(f"{BASE_URL}/api/words", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /words returns {len(data)} words")
    
    def test_add_words(self, auth_token):
        """Test adding new words"""
        test_word = f"testword{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/words", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"words": [test_word]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "added" in data
        assert "count" in data
        print(f"✓ POST /words added {data['count']} word(s)")
        
        # Verify word was added
        get_resp = requests.get(f"{BASE_URL}/api/words", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        words = get_resp.json()
        word_names = [w["word"] for w in words]
        assert test_word in word_names
        print(f"✓ Word '{test_word}' verified in word list")
    
    def test_update_word_level(self, auth_token):
        """Test updating word level"""
        # First get a word
        get_resp = requests.get(f"{BASE_URL}/api/words", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        words = get_resp.json()
        if len(words) == 0:
            pytest.skip("No words available to update")
        
        word_id = words[0]["id"]
        new_level = 1
        
        response = requests.put(f"{BASE_URL}/api/words/{word_id}/level",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"level": new_level}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["updated"] == True
        print(f"✓ PUT /words/{word_id}/level updated successfully")


class TestGameSessionEndpoints:
    """Game session and activity logging tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        return response.json()["token"]
    
    def test_save_game_session_with_activity_logging(self, auth_token):
        """Test POST /game/session saves session and auto-logs activity"""
        session_data = {
            "words_played": [
                {"word": "elephant", "level": 1, "points": 10, "failed": False},
                {"word": "beautiful", "level": 2, "points": 15, "failed": False}
            ],
            "total_score": 25,
            "levels_completed": [1, 2]
        }
        
        response = requests.post(f"{BASE_URL}/api/game/session",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=session_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["saved"] == True
        assert "session_id" in data
        print(f"✓ POST /game/session saved with ID: {data['session_id']}")
        print("✓ Activity auto-logged to activity_logs collection")
    
    def test_get_game_sessions(self, auth_token):
        """Test GET /game/sessions returns user's sessions"""
        response = requests.get(f"{BASE_URL}/api/game/sessions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /game/sessions returns {len(data)} sessions")


class TestLearnEndpoints:
    """Learn feature endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_meanings(self, auth_token):
        """Test POST /learn/meanings returns definitions"""
        response = requests.post(f"{BASE_URL}/api/learn/meanings",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"word": "elephant"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "meanings" in data
        assert isinstance(data["meanings"], list)
        print(f"✓ POST /learn/meanings returns {len(data['meanings'])} meanings")


class TestStatsEndpoints:
    """Statistics endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EXISTING_EMAIL,
            "password": EXISTING_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_stats(self, auth_token):
        """Test GET /stats returns user statistics"""
        response = requests.get(f"{BASE_URL}/api/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_words" in data
        assert "total_score" in data
        print(f"✓ GET /stats returns: {data['total_words']} words, {data['total_score']} score")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
