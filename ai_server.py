import os
import json
import urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for Electron frontend

# Hugging Face server URL (Serverless Inference Endpoint)
HF_API_URL = "https://api-inference.huggingface.co/models/google/gemma-2-9b-it"
# Direct Token authorization
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "YOUR_HF_API_TOKEN")

print("Nebula Nix Server starting with remote Hugging Face API connection...")

SYSTEM_INSTRUCTIONS = """
You are Nebula Nix 1.1, the built-in local AI companion for the Nebula Browser.
You were created by the Nebula team.
You know what Nebula Browser is and how to use it.

Key features of Nebula Browser:
1. Nebula Drive (nebula://drive) - A secure workspace to store, preview, and manage local files.
2. Nebula Gallery (nebula://gallery) - A visual media grid for images and lightbox previews.
3. Passwords Vault (nebula://passwords) - Local credentials database and random password generator.
4. PDF Viewer (nebula://pdf) - Secure local PDF viewer sandbox.
5. Dynamic Custom Themes - Midnight Void (OLED black), Nebula Protocol (cyber teal/green), Cyberpunk Neon, and Aurora Glass.
6. HTTPS-Only Mode - Blocks non-secure HTTP connections.
7. Privacy Mode - Timed permissions (e.g. allow for 5 minutes).
8. Nebula Nuke Mode - Disables saving history for the session.

Respond concisely, informatively, and stay in character as Nebula Nix 1.1.
"""

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    prompt = data.get("prompt", "")
    history = data.get("history", []) # List of past exchanges: [{"role": "user", "content": "..."}, {"role": "model", "content": "..."}]

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    # Build conversation context with system instructions
    messages = [{"role": "system", "content": SYSTEM_INSTRUCTIONS}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": prompt})

    # Call Hugging Face API
    try:
        # Build prompt format suitable for chat model
        formatted_prompt = ""
        for msg in messages:
            role_prefix = "<|im_start|>" + msg["role"] + "\n"
            content = msg["content"] + "<|im_end|>\n"
            formatted_prompt += role_prefix + content
        formatted_prompt += "<|im_start|>assistant\n"

        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": 300,
                "return_full_text": False
            }
        }
        
        req = urllib.request.Request(
            HF_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                **({"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {})
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            
            if isinstance(res_data, list) and len(res_data) > 0:
                response_text = res_data[0].get("generated_text", "")
            else:
                response_text = res_data.get("generated_text", "")
                
            # Strip system prefix if any leaks
            if "<|im_start|>" in response_text:
                response_text = response_text.split("<|im_start|>")[0].strip()
    except Exception as e:
        print(f"Hugging Face server request failed: {e}")
        # Simulation Mode fallback if API call fails
        prompt_lower = prompt.lower()
        if "who are you" in prompt_lower or "identity" in prompt_lower:
            response_text = "I am Nebula Nix 1.1, your built-in local AI companion for the Nebula Browser. I run locally via Hugging Face's Gemma model and can help you navigate local apps like Drive, Gallery, Passwords, or explain Nix autofill security features!"
        elif "drive" in prompt_lower or "gallery" in prompt_lower:
            response_text = "To access your files, navigate to nebula://drive in the address bar. You can view image highlights in the gallery at nebula://gallery."
        elif "theme" in prompt_lower:
            response_text = "You can customize my design system in Settings using Midnight Void or Nebula Protocol themes."
        else:
            response_text = f"Hello! I am Nebula Nix 1.1. (Simulation Mode active). You asked: '{prompt}'. Let me know how I can assist you with your local files, passwords, or settings!"

    return jsonify({"response": response_text.strip()})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
