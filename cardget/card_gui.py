import os
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import cv2
import cardget

def scan_card(image_path):
    corrected = cardget.extract_card_from_photo(image_path)
    temp_path = "temp_warped.jpg"
    cv2.imwrite(temp_path, corrected)

    card_name = cardget.extract_card_name(temp_path)
    card_number = cardget.extract_card_number(temp_path)

    if card_name:
        card = cardget.search_card(card_name, card_number)
        if card:
            return card_name, card_number, card
    return card_name, card_number, None

def display_results(card_name, card_number, card):
    output_text.delete(1.0, tk.END)
    output_text.insert(tk.END, f"[NAME]: {card_name or 'Failed'}\n")
    output_text.insert(tk.END, f"[NUMBER]: {card_number or 'Failed'}\n")

    if card:
        output_text.insert(tk.END, f"\n🃏 Name: {card['name']}\n")
        output_text.insert(tk.END, f"📦 Set: {card['set']['name']}\n")
        output_text.insert(tk.END, f"⭐ Rarity: {card.get('rarity', 'Unknown')}\n")
        prices = card.get("tcgplayer", {}).get("prices", {})
        if prices:
            for variant, price_info in prices.items():
                output_text.insert(tk.END, f"\n💰 Variant: {variant}\n")
                for key, val in price_info.items():
                    output_text.insert(tk.END, f"  {key}: ${val}\n")
        else:
            output_text.insert(tk.END, "No price data available.\n")
    else:
        output_text.insert(tk.END, "No match found.\n")

def load_and_scan():
    file_path = filedialog.askopenfilename(filetypes=[("Image Files", "*.jpg *.jpeg *.png")])
    if not file_path:
        return
    image = Image.open(file_path)
    image.thumbnail((300, 300))
    photo = ImageTk.PhotoImage(image)
    image_label.configure(image=photo)
    image_label.image = photo

    card_name, card_number, card = scan_card(file_path)
    display_results(card_name, card_number, card)

def batch_scan():
    dir_path = filedialog.askdirectory()
    if not dir_path:
        return
    results = []
    for filename in os.listdir(dir_path):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            path = os.path.join(dir_path, filename)
            card_name, card_number, card = scan_card(path)
            results.append((filename, card_name, card_number, card['name'] if card else 'Not Found'))

    output_text.delete(1.0, tk.END)
    for entry in results:
        output_text.insert(tk.END, f"{entry[0]}: {entry[1]} #{entry[2]} => {entry[3]}\n")

# GUI Setup
root = tk.Tk()
root.title("Pokémon Card Scanner")

frame = tk.Frame(root)
frame.pack(padx=10, pady=10)

image_label = tk.Label(frame)
image_label.pack()

button_frame = tk.Frame(frame)
button_frame.pack(pady=5)

load_button = tk.Button(button_frame, text="Scan Single Image", command=load_and_scan)
load_button.pack(side=tk.LEFT, padx=5)

batch_button = tk.Button(button_frame, text="Batch Scan Folder", command=batch_scan)
batch_button.pack(side=tk.LEFT, padx=5)

output_text = tk.Text(frame, height=20, width=60)
output_text.pack()

root.mainloop()
