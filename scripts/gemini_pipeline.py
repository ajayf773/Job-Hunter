#!/usr/bin/env python3

"""
gemini_pipeline.py

Standalone Python pipeline script that communicates directly with the Gemini API.
Uses Python built-in urllib to make zero-dependency Gemini API calls.
Offloads 100% of LLM processing out of the CLI context window, saving CLI tokens.

Usage:
  python3 scripts/gemini_pipeline.py --jd jds/sample.md --prompt "Evaluate role"
"""

import os
import sys
import json
import urllib.request
import urllib.error

def call_gemini_api(prompt_text, system_instruction="You are an expert technical evaluator.", model="gemini-2.5-flash"):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\n{prompt_text}"}
                ]
            }
        ]
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get('candidates', [])
            if candidates:
                text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                return text
            return ""
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"⚠️ Gemini API Error HTTP {e.code}: {error_body}", file=sys.stderr)
        return ""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/gemini_pipeline.py --jd <path_to_jd>")
        sys.exit(0)
    
    jd_path = sys.argv[1]
    if os.path.exists(jd_path):
        with open(jd_path, 'r', encoding='utf-8') as f:
            jd_text = f.read()
        print(f"🚀 Running Python Direct Gemini API Evaluation on {jd_path}...")
        result = call_gemini_api(f"Evaluate this job description for fit:\n\n{jd_text}")
        print("\n--- Gemini API Response ---")
        print(result[:500] + "...\n[Output truncated for display]")
