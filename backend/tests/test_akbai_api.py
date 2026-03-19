"""
AKBai API Tests
Tests for authentication, chat endpoint, PWA assets, and routing behavior.
"""

import pytest
import requests
import os

# Get BASE_URL from environment (required - no defaults)
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')


class TestAPIHealth:
    """Basic API health and availability tests"""
    
    def test_api_base_url_configured(self):
        """Verify BASE_URL is set"""
        assert BASE_URL is not None, "REACT_APP_BACKEND_URL environment variable not set"
        assert BASE_URL.startswith("http"), f"Invalid BASE_URL: {BASE_URL}"
        print(f"✓ Using BASE_URL: {BASE_URL}")


class TestChatEndpoint:
    """Tests for POST /api/chat - AI chat handler"""
    
    def test_chat_requires_authentication(self):
        """POST /api/chat without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "hello"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "UNAUTHORIZED"
        assert "message_tl" in data["error"]  # Taglish message
        print("✓ Chat endpoint correctly requires authentication")
    
    def test_chat_returns_proper_error_structure(self):
        """Verify error response structure includes all required fields"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "test"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        data = response.json()
        # Verify error structure
        assert "success" in data
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        assert "message_tl" in data["error"]
        print("✓ Error response has proper structure")


class TestPWAAssets:
    """Tests for PWA-related static assets"""
    
    def test_manifest_json_returns_200(self):
        """PWA manifest.json should be accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data
        assert "short_name" in data
        assert "icons" in data
        assert data["short_name"] == "AKBai"
        print(f"✓ manifest.json OK - App name: {data['name']}")
    
    def test_service_worker_returns_200(self):
        """Service worker sw.js should be accessible"""
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "addEventListener" in response.text
        print("✓ sw.js accessible")
    
    def test_icon_192_returns_200(self):
        """PWA icon 192x192 should be accessible"""
        response = requests.get(f"{BASE_URL}/icons/icon-192.png", timeout=10)
        # May return 200 or 304
        assert response.status_code in [200, 304], f"Expected 200/304, got {response.status_code}"
        print("✓ icon-192.png accessible")
    
    def test_icon_512_returns_200(self):
        """PWA icon 512x512 should be accessible"""
        response = requests.get(f"{BASE_URL}/icons/icon-512.png", timeout=10)
        assert response.status_code in [200, 304], f"Expected 200/304, got {response.status_code}"
        print("✓ icon-512.png accessible")


class TestAuthRouting:
    """Tests for authentication-related routing behavior"""
    
    def test_auth_callback_without_code_redirects(self):
        """GET /auth/callback without code should redirect to /login"""
        response = requests.get(
            f"{BASE_URL}/auth/callback",
            allow_redirects=False,
            timeout=10
        )
        # Should be a redirect (307)
        assert response.status_code in [307, 302, 303], f"Expected redirect, got {response.status_code}"
        
        # Follow redirect
        response_final = requests.get(
            f"{BASE_URL}/auth/callback",
            allow_redirects=True,
            timeout=10
        )
        assert "/login" in response_final.url, f"Expected redirect to /login, got {response_final.url}"
        print("✓ /auth/callback redirects to /login when no code")
    
    def test_login_page_accessible(self):
        """GET /login should return 200"""
        response = requests.get(f"{BASE_URL}/login", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "AKBai" in response.text
        print("✓ Login page accessible")
    
    def test_chat_page_redirects_unauthenticated(self):
        """GET /chat without auth should redirect to /login"""
        response = requests.get(
            f"{BASE_URL}/chat",
            allow_redirects=True,
            timeout=10
        )
        # Should end up at login page
        assert "/login" in response.url, f"Expected redirect to /login, got {response.url}"
        print("✓ /chat redirects unauthenticated users to /login")


class TestContentValidation:
    """Tests for content validation on endpoints"""
    
    def test_chat_empty_body_still_requires_auth(self):
        """POST /api/chat with empty body should require auth first"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        # Auth check happens before body validation
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Empty body request still requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
