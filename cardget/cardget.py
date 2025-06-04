import os
import cv2
import re
import numpy as np
import pytesseract
import requests
import easyocr

# Setup for Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ['TESSDATA_PREFIX'] = r"C:\Program Files\Tesseract-OCR\tessdata"

POKEMON_API = "https://api.pokemontcg.io/v2/cards"
reader = easyocr.Reader(['en'], gpu=False)

# --- CARD EDGE DETECTION AND TRANSFORM ---
def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

def extract_card_from_photo(image_path):
    image = cv2.imread(image_path)
    ratio = image.shape[0] / 500.0
    orig = image.copy()
    image = cv2.resize(image, (int(image.shape[1] / ratio), 500))

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)

    cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]

    screenCnt = None
    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            screenCnt = approx
            break

    if screenCnt is None:
        print("[WARNING] Card edges not found. Using original image.")
        return orig

    warped = four_point_transform(orig, screenCnt.reshape(4, 2) * ratio)
    return warped

# --- OCR LOGIC ---
def extract_card_name(image_path):
    image = cv2.imread(image_path)
    height, width, _ = image.shape
    name_area = image[0:int(0.2 * height), int(0.1 * width):int(0.9 * width)]

    name_area = cv2.resize(name_area, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(name_area, cv2.COLOR_BGR2GRAY)
    sharpened = cv2.GaussianBlur(gray, (0, 0), 3)
    sharpened = cv2.addWeighted(gray, 1.5, sharpened, -0.5, 0)
    _, thresh = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    cv2.imwrite("debug_name_crop.jpg", thresh)

    text = pytesseract.image_to_string(thresh, lang='eng', config='--psm 6')
    print("[OCR TEXT - NAME]")
    print(repr(text))

    match = re.search(r'\b[A-Z][a-z]{2,}\b', text)
    if match:
        return match.group(0)

    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        return lines[0]
    return None

def extract_card_number(image_path):
    import pytesseract

    image = cv2.imread(image_path)
    height, width, _ = image.shape
    number_area = image[int(0.92 * height):int(0.975 * height), int(0.70 * width):int(0.96 * width)]
    number_area = cv2.resize(number_area, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_LINEAR)

    gray = cv2.cvtColor(number_area, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
    enhanced = clahe.apply(gray)
    blurred = cv2.GaussianBlur(enhanced, (0, 0), 3)
    sharpened = cv2.addWeighted(enhanced, 1.5, blurred, -0.5, 0)

    cv2.imwrite("debug_number_crop.jpg", sharpened)

    # First try: EasyOCR
    print("[OCR TEXT - CARD NUMBER] EasyOCR Scan:")
    results = reader.readtext(sharpened)
    for _, text, conf in results:
        print(f"EasyOCR Detected: '{text}' (confidence={conf:.2f})")
        if conf < 0.3:
            continue
        clean = text.replace('I', '1').replace('l', '1').replace('|', '1').replace('O', '0').replace('o', '0')
        match = re.search(r'(\\d{1,3})/\\d{2,4}', clean)
        if match:
            return match.group(1)

    # Fallback: Tesseract
    print("[FALLBACK] Tesseract scan...")
    text = pytesseract.image_to_string(sharpened, config='--psm 6')
    print(f"Tesseract Detected: '{text}'")
    clean = text.replace('I', '1').replace('l', '1').replace('|', '1').replace('O', '0').replace('o', '0')
    match = re.search(r'(\\d{1,3})/\\d{2,4}', clean)
    if match:
        return match.group(1)

    print("[ERROR] Both OCR methods failed.")
    return None


    # FINAL fallback: find the first digit group in the image just in case
    print("[DEBUG] Fallback: brute force number guess.")
    fallback_text = "".join([text for (_, text, conf) in results])
    fallback_text = fallback_text.replace('I', '1').replace('O', '0')
    match = re.search(r'(\\d{1,3})/\\d{2,4}', fallback_text)
    if match:
        return match.group(1)

    print("[ERROR] EasyOCR totally failed.")
    return None

# --- API + DISPLAY ---
def search_card(card_name, number=None):
    print(f"[SEARCHING] {card_name}" + (f" #{number}" if number else ""))
    if number:
        query = f'name:"{card_name}" number:"{number}"'
    else:
        query = f'name:"{card_name}"'
    response = requests.get(POKEMON_API, params={"q": query})
    data = response.json()
    if data.get("data"):
        return data["data"][0]
    return None

def display_card_info(card):
    print(f"\n🃏 Name: {card['name']}")
    print(f"📦 Set: {card['set']['name']}")
    print(f"⭐ Rarity: {card.get('rarity', 'Unknown')}")
    prices = card.get("tcgplayer", {}).get("prices", {})
    if prices:
        for variant, price_info in prices.items():
            print(f"\n💰 Variant: {variant}")
            for key, val in price_info.items():
                print(f"  {key}: ${val}")
    else:
        print("No price data available.")

# === MAIN ===
image_path = "card.jpg"
corrected = extract_card_from_photo(image_path)
cv2.imwrite("warped.jpg", corrected)

card_name = extract_card_name("warped.jpg")
card_number = extract_card_number("warped.jpg")

if card_name:
    card = search_card(card_name, card_number)
    if card:
        display_card_info(card)
    else:
        print("No match found.")
else:
    print("Failed to extract card name.")