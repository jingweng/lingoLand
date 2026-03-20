#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timezone

# Use the public URL from frontend .env
BASE_URL = "https://forest-spell-lab.preview.emergentagent.com/api"

class SpellingQuestAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.student_token = None
        self.teacher_token = None
        self.student_id = None
        self.teacher_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_student = {
            "username": f"test_student_{timestamp}",
            "email": f"student_{timestamp}@test.com",
            "password": "TestPassword123!",
            "role": "student"
        }
        self.test_teacher = {
            "username": f"test_teacher_{timestamp}",
            "email": f"teacher_{timestamp}@test.com", 
            "password": "TestPassword123!",
            "role": "teacher"
        }

    def log_test(self, name, success, details=""):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "passed": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make API request with proper error handling"""
        url = f"{self.base_url}/{endpoint}"
        
        # Prepare headers
        req_headers = {'Content-Type': 'application/json'}
        if headers:
            req_headers.update(headers)
        if token:
            req_headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {str(e)}")
            return None

    # AUTH TESTS
    def test_api_root(self):
        """Test API root endpoint"""
        response = self.make_request('GET', '')
        if response and response.status_code == 200:
            data = response.json()
            success = "Spelling Quest" in data.get("message", "")
            self.log_test("API Root", success, f"Status: {response.status_code}")
            return success
        self.log_test("API Root", False, f"Failed to connect or bad response")
        return False

    def test_student_registration(self):
        """Test student registration"""
        response = self.make_request('POST', 'auth/register', self.test_student)
        if response and response.status_code == 200:
            data = response.json()
            if 'token' in data and 'user' in data:
                self.student_token = data['token']
                self.student_id = data['user']['id']
                success = data['user']['role'] == 'student'
                self.log_test("Student Registration", success, f"User ID: {self.student_id}")
                return success
        self.log_test("Student Registration", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_teacher_registration(self):
        """Test teacher registration"""
        response = self.make_request('POST', 'auth/register', self.test_teacher)
        if response and response.status_code == 200:
            data = response.json()
            if 'token' in data and 'user' in data:
                self.teacher_token = data['token']
                self.teacher_id = data['user']['id']
                success = data['user']['role'] == 'teacher'
                self.log_test("Teacher Registration", success, f"User ID: {self.teacher_id}")
                return success
        self.log_test("Teacher Registration", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_student_login(self):
        """Test student login"""
        login_data = {"email": self.test_student["email"], "password": self.test_student["password"]}
        response = self.make_request('POST', 'auth/login', login_data)
        if response and response.status_code == 200:
            data = response.json()
            success = 'token' in data and data.get('user', {}).get('role') == 'student'
            self.log_test("Student Login", success)
            return success
        self.log_test("Student Login", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_auth_me_student(self):
        """Test /auth/me with student token"""
        response = self.make_request('GET', 'auth/me', token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('role') == 'student' and data.get('id') == self.student_id
            self.log_test("Auth Me - Student", success)
            return success
        self.log_test("Auth Me - Student", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_auth_me_teacher(self):
        """Test /auth/me with teacher token"""
        response = self.make_request('GET', 'auth/me', token=self.teacher_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('role') == 'teacher' and data.get('id') == self.teacher_id
            self.log_test("Auth Me - Teacher", success)
            return success
        self.log_test("Auth Me - Teacher", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    # WORD BANK TESTS
    def test_add_words(self):
        """Test adding words to word bank"""
        words_data = {"words": ["apple", "banana", "computer", "elephant"]}
        response = self.make_request('POST', 'words', words_data, token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('count', 0) > 0 and 'added' in data
            self.log_test("Add Words", success, f"Added: {data.get('count', 0)} words")
            return success
        self.log_test("Add Words", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_get_words(self):
        """Test getting words from word bank"""
        response = self.make_request('GET', 'words', token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list) and len(data) > 0
            self.log_test("Get Words", success, f"Found: {len(data)} words")
            # Store word ID for later tests
            if data:
                self.test_word_id = data[0]['id']
                self.test_word_name = data[0]['word']
            return success
        self.log_test("Get Words", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_update_word_level(self):
        """Test updating word mastery level"""
        if not hasattr(self, 'test_word_id'):
            self.log_test("Update Word Level", False, "No word ID available")
            return False
            
        level_data = {"level": 2}
        response = self.make_request('PUT', f'words/{self.test_word_id}/level', level_data, token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('updated') == True
            self.log_test("Update Word Level", success)
            return success
        self.log_test("Update Word Level", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_delete_word(self):
        """Test deleting a word"""
        if not hasattr(self, 'test_word_id'):
            self.log_test("Delete Word", False, "No word ID available")
            return False
            
        response = self.make_request('DELETE', f'words/{self.test_word_id}', token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('deleted') == True
            self.log_test("Delete Word", success)
            return success
        self.log_test("Delete Word", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_import_text(self):
        """Test importing words from text"""
        import_data = {"text": "The quick brown fox jumps over the lazy dog. This sentence contains many words that should be extracted."}
        response = self.make_request('POST', 'words/import/text', import_data, token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('count', 0) > 0
            self.log_test("Import Text", success, f"Imported: {data.get('count', 0)} words")
            return success
        self.log_test("Import Text", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    # STATS TESTS
    def test_get_stats(self):
        """Test getting user statistics"""
        response = self.make_request('GET', 'stats', token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            required_keys = ['total_words', 'level_counts', 'total_sessions', 'total_score']
            success = all(key in data for key in required_keys)
            self.log_test("Get Stats", success, f"Words: {data.get('total_words', 0)}")
            return success
        self.log_test("Get Stats", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    # GAME TESTS
    def test_get_definitions(self):
        """Test getting word definitions via OpenAI"""
        definitions_data = {"word": "apple"}
        response = self.make_request('POST', 'game/definitions', definitions_data, token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = 'definitions' in data and 'distractors' in data and data.get('word') == 'apple'
            self.log_test("Get Definitions (AI)", success, f"Got {len(data.get('definitions', []))} definitions")
            return success
        self.log_test("Get Definitions (AI)", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_check_grammar(self):
        """Test grammar checking via OpenAI"""
        grammar_data = {
            "sentence": "I like apples because they are sweet and healthy.",
            "target_word": "apple"
        }
        response = self.make_request('POST', 'game/check-grammar', grammar_data, token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            required_keys = ['uses_target_word', 'word_count', 'spelling_errors', 'grammar_errors', 'score_breakdown']
            success = all(key in data for key in required_keys)
            self.log_test("Check Grammar (AI)", success, f"Score: {data.get('score_breakdown', {}).get('total', 0)}")
            return success
        self.log_test("Check Grammar (AI)", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_save_game_session(self):
        """Test saving game session"""
        session_data = {
            "words_played": [
                {"word": "apple", "level": 1, "points": 15},
                {"word": "banana", "level": 2, "points": 20}
            ],
            "total_score": 35,
            "levels_completed": [1, 2]
        }
        response = self.make_request('POST', 'game/session', session_data, token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = data.get('saved') == True and 'session_id' in data
            self.log_test("Save Game Session", success, f"Session ID: {data.get('session_id', 'N/A')}")
            return success
        self.log_test("Save Game Session", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_get_game_sessions(self):
        """Test getting game session history"""
        response = self.make_request('GET', 'game/sessions', token=self.student_token)
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list) and len(data) >= 0  # Can be empty initially
            self.log_test("Get Game Sessions", success, f"Found: {len(data)} sessions")
            return success
        self.log_test("Get Game Sessions", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    # TEACHER TESTS
    def test_get_students(self):
        """Test teacher viewing all students"""
        response = self.make_request('GET', 'teacher/students', token=self.teacher_token)
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list) and len(data) >= 1  # Should include our test student
            self.log_test("Teacher - Get Students", success, f"Found: {len(data)} students")
            return success
        self.log_test("Teacher - Get Students", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_get_student_words(self):
        """Test teacher viewing student's words"""
        if not self.student_id:
            self.log_test("Teacher - Get Student Words", False, "No student ID available")
            return False
            
        response = self.make_request('GET', f'teacher/students/{self.student_id}/words', token=self.teacher_token)
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list)  # Can be empty
            self.log_test("Teacher - Get Student Words", success, f"Found: {len(data)} words")
            return success
        self.log_test("Teacher - Get Student Words", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    # TEST UNAUTHORIZED ACCESS
    def test_unauthorized_access(self):
        """Test that endpoints require authentication"""
        # Test without token
        response = self.make_request('GET', 'words')
        success = response and response.status_code == 401
        self.log_test("Unauthorized Access Protection", success, "401 when no token provided")
        return success

    def test_role_based_access(self):
        """Test that student can't access teacher endpoints"""
        response = self.make_request('GET', 'teacher/students', token=self.student_token)
        success = response and response.status_code == 403
        self.log_test("Role-based Access Protection", success, "Student blocked from teacher endpoint")
        return success

    def run_all_tests(self):
        """Run all tests in order"""
        print("🎯 Starting Jason's Spelling Quest API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("-" * 60)

        # API Root
        if not self.test_api_root():
            print("❌ API root failed - stopping tests")
            return self.get_summary()

        # Authentication Tests
        print("\n🔐 Testing Authentication...")
        self.test_student_registration()
        self.test_teacher_registration()
        self.test_student_login()
        self.test_auth_me_student()
        self.test_auth_me_teacher()

        if not self.student_token:
            print("❌ Student authentication failed - skipping student tests")
            return self.get_summary()

        # Word Bank Tests
        print("\n📚 Testing Word Bank...")
        self.test_add_words()
        self.test_get_words()
        self.test_update_word_level()
        self.test_import_text()
        
        # Stats Tests
        print("\n📊 Testing Statistics...")
        self.test_get_stats()

        # Game API Tests (AI Integration)
        print("\n🎮 Testing Game APIs (AI Integration)...")
        self.test_get_definitions()
        self.test_check_grammar()
        self.test_save_game_session()
        self.test_get_game_sessions()

        # Teacher Tests
        print("\n👨‍🏫 Testing Teacher Dashboard...")
        if self.teacher_token:
            self.test_get_students()
            self.test_get_student_words()

        # Security Tests
        print("\n🛡️ Testing Security...")
        self.test_unauthorized_access()
        self.test_role_based_access()

        # Clean up - delete the test word if it exists
        if hasattr(self, 'test_word_id'):
            print("\n🧹 Cleaning up...")
            self.test_delete_word()

        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        
        print("\n" + "=" * 60)
        print(f"🎯 Test Summary: {self.tests_passed}/{self.tests_run} tests passed ({success_rate:.1f}%)")
        
        if self.tests_passed == self.tests_run:
            print("✅ All tests passed! API is working correctly.")
            return True
        else:
            failed_tests = [r for r in self.test_results if not r['passed']]
            print(f"❌ {len(failed_tests)} tests failed:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            return False

def main():
    tester = SpellingQuestAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())