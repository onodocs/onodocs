import os
import sys
import urllib.request
import json

base = os.environ.get("ONODOCS_SERVICE_URL", "http://127.0.0.1:5191")
headers = {"Authorization": "Bearer " + os.environ["ONODOCS_SERVICE_TOKEN"]}

def request(path, method="GET", data=None):
    with urllib.request.urlopen(urllib.request.Request(base + path, data=data, headers=headers, method=method)) as response:
        return response.read()

with open(sys.argv[1], "rb") as source:
    document = json.loads(request("/documents", "POST", source.read()))
try:
    with open(sys.argv[2], "wb") as output:
        output.write(request(document["url"] + "/pdf"))
finally:
    request(document["url"], "DELETE")
