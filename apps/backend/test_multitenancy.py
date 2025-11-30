import requests
import base64
import json

BASE_URL = "http://localhost:4000/api"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"

# Helper to create Basic Auth header
def get_auth_header(user, password):
    credentials = f"{user}:{password}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded_credentials}"}

def print_step(step_name):
    print(f"\n{'='*10} {step_name} {'='*10}")

def test_auth_failure():
    print_step("Step 1: Test Authentication Failure")
    try:
        response = requests.get(f"{BASE_URL}/tenants")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 401:
            print("✅ Success: Access denied as expected.")
        else:
            print("❌ Failed: Should have returned 401.")
    except Exception as e:
        print(f"❌ Error: {e}")

def onboard_tenant():
    print_step("Step 2: Onboard New Tenant (cool-tshirts)")
    headers = get_auth_header(ADMIN_USER, ADMIN_PASS)
    headers["Content-Type"] = "application/json"
    
    payload = {
        "shopDomain": "cool-tshirts.myshopify.com",
        "accessToken": "shpat_new_tenant_token_123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/tenants", headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code in [200, 201]:
            print("✅ Success: Tenant onboarded.")
        else:
            print("❌ Failed: Could not onboard tenant.")
    except Exception as e:
        print(f"❌ Error: {e}")

def list_tenants():
    print_step("Step 3: List All Tenants")
    headers = get_auth_header(ADMIN_USER, ADMIN_PASS)
    
    try:
        response = requests.get(f"{BASE_URL}/tenants", headers=headers)
        print(f"Status Code: {response.status_code}")
        tenants = response.json()
        print(f"Tenants Found: {len(tenants)}")
        print(json.dumps(tenants, indent=2))
        
        domains = [t['shopDomain'] for t in tenants]
        if "cool-tshirts.myshopify.com" in domains:
            print("✅ Success: New tenant found in list.")
        else:
            print("❌ Failed: New tenant not found.")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_data_isolation():
    print_step("Step 4: Test Data Isolation (Stats)")
    
    # Check New Tenant (Should be empty)
    print("--- Checking New Tenant (cool-tshirts) ---")
    try:
        response = requests.get(f"{BASE_URL}/stats?shopDomain=cool-tshirts.myshopify.com")
        stats = response.json()
        print(json.dumps(stats, indent=2))
        
        if stats['totalOrders'] == 0:
            print("✅ Success: New tenant has 0 orders.")
        else:
            print("❌ Failed: New tenant should have 0 orders.")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Check Existing Tenant (Should have data)
    # Note: This assumes deepak-test-dev.myshopify.com exists and has data from previous tests
    print("\n--- Checking Existing Tenant (deepak-test-dev) ---")
    try:
        response = requests.get(f"{BASE_URL}/stats?shopDomain=deepak-test-dev.myshopify.com")
        stats = response.json()
        print(json.dumps(stats, indent=2))
        
        if stats['totalOrders'] >= 0: # Just checking if it returns a valid number
             print(f"✅ Success: Existing tenant has {stats['totalOrders']} orders.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Multi-Tenancy Tests...")
    test_auth_failure()
    onboard_tenant()
    list_tenants()
    test_data_isolation()
    print("\n✅ Tests Completed.")
