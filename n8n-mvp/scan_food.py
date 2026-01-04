import requests
import json
import argparse
import os

# Your n8n Webhook URL (Make sure the workflow is ACTIVE)
DEFAULT_URL = "http://localhost:3001/webhook/46c547d2-3645-42af-a02a-scan-food"

def analyze_food(image_path: str, question: str, url: str = DEFAULT_URL) -> None:
    """Send image path and question to the webhook URL and print the response.

    Args:
        image_path: Local path to the image file.
        question: Question to ask the AI about the image.
        url: Webhook URL to send the payload to.
    """
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return

    payload: dict[str, str] = {
        "image_path": image_path,
        "question": question,
    }

    print("🚀 Sending to AI Brain...")
    try:
        response = requests.post(url, json=payload, timeout=30)
    except requests.exceptions.RequestException as exc:
        print(f"❌ Network error: {exc}")
        return

    if response.status_code == 200:
        print("\n✅ AI NUTRITIONIST REPORT:")
        # Try to pretty-print JSON responses
        try:
            data = response.json()
            print(json.dumps(data, indent=2))
        except ValueError:
            print(response.text)
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")


def main():
    parser = argparse.ArgumentParser(description="Send a food image path and question to the n8n webhook.")
    parser.add_argument("image_path", help="Path to the image file (local path)")
    parser.add_argument("-q", "--question", default="How healthy is this?", help="Question to ask about the image")
    parser.add_argument("--url", default=DEFAULT_URL, help="Webhook URL (default: local n8n webhook)")
    args = parser.parse_args()

    analyze_food(args.image_path, args.question, url=args.url)


if __name__ == "__main__":
    main()
