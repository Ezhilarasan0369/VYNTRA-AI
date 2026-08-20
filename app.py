from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Ollama local API
OLLAMA_URL = "http://localhost:11434/api/chat"

# Model downloaded in Ollama
MODEL_NAME = "llama3.2:3b"


SYSTEM_PROMPT = """
You are Ezhil AI, a personal AI assistant.

LANGUAGE RULES:
- English is your default language.
- If the user's message is entirely in English, reply ONLY in English.
- Never add Tamil words or Tamil greetings to an English conversation.
- If the user writes Tanglish (Tamil using English letters), reply in Tanglish.
- If the user writes using Tamil script, reply in Tamil.
- Match the language style of the user's latest message.

PERSONALITY:
- Be friendly, professional, clear, and helpful.
- Give concise answers by default.
- Give detailed explanations when the user asks for them.
- Explain technical topics in a simple way.

YOU ARE ESPECIALLY HELPFUL WITH:
- Programming
- Java
- Python
- HTML
- CSS
- JavaScript
- Networking
- CCNA
- Cloud Computing
- Linux
- IT Infrastructure
- Cybersecurity fundamentals
- Interview preparation
- Resume and career guidance
"""


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "assistant": "Ezhil AI",
        "model": MODEL_NAME
    })


@app.route("/chat", methods=["POST"])
def chat():

    try:
        data = request.get_json(silent=True) or {}

        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({
                "error": "Message is empty"
            }), 400

        payload = {
            "model": MODEL_NAME,

            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],

            "stream": False
        }

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=120
        )

        response.raise_for_status()

        result = response.json()

        ai_reply = (
            result
            .get("message", {})
            .get("content", "")
            .strip()
        )

        if not ai_reply:
            return jsonify({
                "error": "Ollama returned an empty response."
            }), 500

        return jsonify({
            "reply": ai_reply
        })

    except requests.exceptions.ConnectionError:

        return jsonify({
            "error":
            "Cannot connect to Ollama. Make sure Ollama is running."
        }), 503

    except requests.exceptions.Timeout:

        return jsonify({
            "error":
            "Ezhil AI took too long to respond. Please try again."
        }), 504

    except requests.exceptions.RequestException as error:

        return jsonify({
            "error": f"Ollama request failed: {str(error)}"
        }), 500

    except Exception as error:

        print("ERROR:", error)

        return jsonify({
            "error": "Something went wrong in Ezhil AI."
        }), 500


if __name__ == "__main__":

    print("--------------------------------")
    print("       EZHIL AI BACKEND")
    print("--------------------------------")
    print(f"Model: {MODEL_NAME}")
    print("Server: http://127.0.0.1:5000")
    print("--------------------------------")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )