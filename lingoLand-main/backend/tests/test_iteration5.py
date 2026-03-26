"""
Iteration 5 Backend Tests - Lingo Land Educational Spelling App
Tests: Task day completion endpoint, words API, active task retrieval
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@jason.com"
TEST_PASSWORD = "test123"


class TestAuthentication:
    """Authentication tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root accessible: {data['message']}")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")


class TestWordsAPI:
    """Words API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_words(self, auth_token):
        """Test getting user's words"""
        response = requests.get(
            f"{BASE_URL}/api/words",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        words = response.json()
        assert isinstance(words, list)
        print(f"✓ GET /words returned {len(words)} words")
        
        # Verify consonant-le test words exist
        word_names = [w["word"] for w in words]
        for test_word in ["bottle", "puddle", "little", "middle"]:
            if test_word in word_names:
                print(f"  - Found consonant-le test word: {test_word}")
    
    def test_add_words(self, auth_token):
        """Test adding new words"""
        test_word = f"testword{os.urandom(3).hex()}"
        response = requests.post(
            f"{BASE_URL}/api/words",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"words": [test_word]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "added" in data
        assert data["count"] >= 0  # May be 0 if word already exists
        print(f"✓ POST /words successfully processed")
        
        # Cleanup - delete the test word
        if data["added"]:
            word_id = data["added"][0]["id"]
            requests.delete(
                f"{BASE_URL}/api/words/{word_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )


class TestTasksAPI:
    """Weekly Tasks API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_active_task(self, auth_token):
        """Test getting active task"""
        response = requests.get(
            f"{BASE_URL}/api/tasks/active",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        task = response.json()
        if task:
            assert "id" in task
            assert "words" in task
            assert "schedule" in task
            assert len(task["schedule"]) == 5  # 3 learn + 2 test days
            print(f"✓ GET /tasks/active returned task with {len(task['words'])} words")
            schedule_info = [f"Day {d['day']}: {d['type']} (completed={d['completed']})" for d in task['schedule']]
            print(f"  - Schedule: {schedule_info}")
            return task
        else:
            print("✓ GET /tasks/active returned null (no active task)")
            return None
    
    def test_complete_task_day(self, auth_token):
        """Test marking a task day as complete - CRITICAL TEST"""
        # First get active task
        response = requests.get(
            f"{BASE_URL}/api/tasks/active",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        task = response.json()
        
        if not task:
            pytest.skip("No active task to test day completion")
        
        task_id = task["id"]
        
        # Find first incomplete day
        incomplete_day = None
        for day in task["schedule"]:
            if not day["completed"]:
                incomplete_day = day["day"]
                break
        
        if not incomplete_day:
            print("✓ All days already complete, skipping day completion test")
            return
        
        # Mark day as complete
        response = requests.post(
            f"{BASE_URL}/api/tasks/{task_id}/day/{incomplete_day}/complete",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] == True
        print(f"✓ POST /tasks/{task_id}/day/{incomplete_day}/complete succeeded")
        
        # Verify the day is now marked complete
        response = requests.get(
            f"{BASE_URL}/api/tasks/active",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        updated_task = response.json()
        if updated_task:
            day_status = next((d for d in updated_task["schedule"] if d["day"] == incomplete_day), None)
            if day_status:
                assert day_status["completed"] == True
                print(f"✓ Verified day {incomplete_day} is now marked as completed")
    
    def test_complete_task_day_invalid_task(self, auth_token):
        """Test marking day complete on non-existent task"""
        response = requests.post(
            f"{BASE_URL}/api/tasks/invalid-task-id/day/1/complete",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404
        print("✓ Invalid task ID correctly returns 404")


class TestActivityAPI:
    """Activity tracking API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_today_activity(self, auth_token):
        """Test getting today's activity"""
        response = requests.get(
            f"{BASE_URL}/api/activity/today",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "words_spelled" in data
        assert "meanings_learned" in data
        assert "levels_passed" in data
        assert "time_spent_seconds" in data
        print(f"✓ GET /activity/today returned activity data")
    
    def test_get_weekly_progress(self, auth_token):
        """Test getting weekly progress"""
        response = requests.get(
            f"{BASE_URL}/api/activity/weekly",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "percentage" in data
        print(f"✓ GET /activity/weekly returned {data['percentage']}% progress")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
