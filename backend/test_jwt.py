import requests
import json

BASE_URL = 'http://localhost:5000'

def test_jwt_flow():
    print("🧪 Testing JWT Authentication Flow")
    
    # Step 1: Register a test user
    print("\n1. Registering test user...")
    register_data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    try:
        r = requests.post(f'{BASE_URL}/register', json=register_data)
        print(f"Register response: {r.status_code} - {r.json()}")
    except:
        print("User might already exist, continuing...")
    
    # Step 2: Login and get token
    print("\n2. Logging in...")
    login_data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    r = requests.post(f'{BASE_URL}/login', json=login_data)
    print(f"Login response: {r.status_code} - {r.json()}")
    
    if r.status_code == 200:
        login_response = r.json()
        token = login_response['access_token']
        print(f"Token received: {token[:50]}...")
        
        # Step 3: Test JWT endpoint first
        print("\n3. Testing JWT endpoint...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        r = requests.get(f'{BASE_URL}/test-jwt', headers=headers)
        print(f"JWT test response: {r.status_code} - {r.json()}")
        
        # Step 4: Test appointment booking with token
        print("\n4. Testing appointment booking with token...")
        
        appointment_data = {
            'doctor_id': 1,
            'date': '2025-07-27 10:00'
        }
        
        r = requests.post(f'{BASE_URL}/appointments', 
                         json=appointment_data, 
                         headers=headers)
        print(f"Appointment response: {r.status_code} - {r.json()}")
        
        # Step 4: Test getting appointments
        print("\n4. Testing get appointments...")
        r = requests.get(f'{BASE_URL}/appointments', headers=headers)
        print(f"Get appointments response: {r.status_code} - {r.json()}")
        
    else:
        print("❌ Login failed!")

if __name__ == "__main__":
    test_jwt_flow()
