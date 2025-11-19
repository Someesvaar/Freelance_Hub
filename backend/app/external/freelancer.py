# app/external/freelancer.py

import requests, re
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html,application/xhtml+xml"
}

def fetch_freelancer_rating(username: str):
    """
    Returns: { "rating": float|null, "reviews": int|null, "raw": str }
    """
    url = f"https://www.freelancer.com/u/{username}"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        html = resp.text
    except:
        return None  # network error

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)

    # e.g. "4.9 · 149 Reviews", "4.8 (203 reviews)", "4.7 / 98 reviews"
    m = re.search(r"([0-9]\.[0-9])\s*[\·\(\-/ ]\s*([0-9,]+)\s*[Rr]eview", text)
    if m:
        rating = float(m.group(1))
        reviews = int(m.group(2).replace(",", ""))
        return {"rating": rating, "reviews": reviews, "raw": text}

    # fallback: rating only
    m2 = re.search(r"([0-9]\.[0-9])\s*(?:rating|star)", text.lower())
    if m2:
        return {"rating": float(m2.group(1)), "reviews": None, "raw": text}

    return {"rating": None, "reviews": None, "raw": text}
