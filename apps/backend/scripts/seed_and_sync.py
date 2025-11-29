import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

API_URL = "http://localhost:3000/api"
# Use SHOP_DOMAIN from env or default to a placeholder
SHOP_DOMAIN = os.getenv("SHOP_DOMAIN", "test-shop.myshopify.com")
ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN")

if not ACCESS_TOKEN:
    print("Error: SHOPIFY_ACCESS_TOKEN not found in .env")
    exit(1)

def seed_tenant():
    """Creates the tenant in the database."""
    url = f"{API_URL}/tenants"
    payload = {
        "shopDomain": SHOP_DOMAIN,
        "accessToken": ACCESS_TOKEN
    }
    print(f"Seeding tenant for {SHOP_DOMAIN}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print(f"Tenant seeded successfully: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to seed tenant: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")

def trigger_sync():
    """Triggers the data sync for the tenant."""
    url = f"{API_URL}/sync"
    payload = {
        "shopDomain": SHOP_DOMAIN
    }
    print(f"Triggering sync for {SHOP_DOMAIN}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print(f"Sync triggered successfully: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to trigger sync: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")

if __name__ == "__main__":
    print("--- Starting Setup Script ---")
    seed_tenant()
    print("\n")
    trigger_sync()
    print("--- Script Finished ---")
