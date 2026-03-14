import requests
import base64
import sys

client_id = "411982bad0d74858b91be99f475ae6c5"
client_secret = "8cb7bb8a4c6a4ae6a463f776144b7a2c"

auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
auth_url = "https://accounts.spotify.com/api/token"
response = requests.post(auth_url, headers={
    "Authorization": f"Basic {auth_header}",
    "Content-Type": "application/x-www-form-urlencoded"
}, data={"grant_type": "client_credentials"})

token = response.json().get("access_token")

search_url = "https://api.spotify.com/v1/search"
headers = {"Authorization": f"Bearer {token}"}

for limit in [1, 5, 10, 15, 20, 50]:
    params = {"q": 'genre:"indie"', "type": "track", "limit": limit, "offset": 0}
    res = requests.get(search_url, headers=headers, params=params)
    print(f"URL: {res.url}")
    print(f"limit={limit} -> HTTP {res.status_code}")
    if res.status_code != 200:
        print(f"Error: {res.text}")
