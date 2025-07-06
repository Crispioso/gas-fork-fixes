import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import os
from pathlib import Path
import subprocess  # For running the card_scanner.py script
import threading  # For running the script in a separate thread
import logging

# --- CONFIG ---
SCRIPT_PATH = "card_scanner.py"  # Path to your card_scanner.py script
DEFAULT_SCAN_FOLDER = "../scans"  # Default folder, can be relative

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CardScannerGUI:
    def __init__(self, master):
        self.master = master
        master.title("Card Scanner GUI")

        self.scan_folder = tk.StringVar(value=DEFAULT_SCAN_FOLDER)

        # --- Folder Selection ---
        ttk.Label(master, text="Scan Folder:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Entry(master, textvariable=self.scan_folder, width=50).grid(row=0, column=1, sticky=(tk.W, tk.E), padx=5, pady=5)
        ttk.Button(master, text="Browse", command=self.browse_folder).grid(row=0, column=2, sticky=tk.E, padx=5, pady=5)

        # --- File List ---
        self.file_list = tk.Listbox(master, width=70, height=20)
        self.file_list.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), padx=5, pady=5)

        # --- Upload Button ---
        ttk.Button(master, text="Upload Cards", command=self.upload_cards).grid(row=2, column=0, columnspan=3, pady=10)

        # --- Status Bar ---
        self.status_text = tk.StringVar(value="Ready")
        ttk.Label(master, textvariable=self.status_text, relief=tk.SUNKEN, anchor=tk.W).grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), padx=5)

        # --- Configure Grid Weights ---
        master.columnconfigure(1, weight=1)
        master.rowconfigure(1, weight=1)

        self.update_file_list()

    def browse_folder(self):
        folder_selected = filedialog.askdirectory()
        if folder_selected:
            self.scan_folder.set(folder_selected)
            self.update_file_list()

    def update_file_list(self):
        self.file_list.delete(0, tk.END)
        folder_path = Path(self.scan_folder.get())
        if folder_path.exists() and folder_path.is_dir():
            for file_path in folder_path.glob("*.*"):  # List all files
                if file_path.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                    self.file_list.insert(tk.END, file_path.name)
        else:
            self.status_text.set("Invalid scan folder.")

    def upload_cards(self):
        # Disable the button to prevent multiple clicks
        upload_button = self.master.grid_slaves(row=2, column=0)[0]  # Get the button instance
        upload_button['state'] = 'disabled'
        self.status_text.set("Uploading cards...")

        # Run the card_scanner.py script in a separate thread
        threading.Thread(target=self.run_card_scanner, daemon=True).start()

    def run_card_scanner(self):
        try:
            # Construct the command to run the script
            command = ["python", SCRIPT_PATH]

            # Set the environment variable for the image folder
            env = os.environ.copy()
            env["IMAGE_FOLDER"] = self.scan_folder.get()
            logging.info(f"Setting IMAGE_FOLDER environment variable to: {self.scan_folder.get()}")

            # Run the script using subprocess
            process = subprocess.Popen(
                command,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace'  # <--- This line is key
)


            # Capture the output of the script
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    output = output.strip()
                    logging.info(f"card_scanner.py output: {output}")  # Log the output
                    self.update_status(output)  # Update status bar

            return_code = process.returncode
            if return_code == 0:
                self.update_status("Card upload complete.")
            else:
                if return_code != 0:
                    error_summary = "Card upload failed."
                    if "OpenAI returned empty content" in self.status_text.get():
                         error_summary = "OpenAI returned empty content. Check API usage, image quality, or retry later."
                    self.update_status(error_summary + f" (Exit Code: {return_code})")

                logging.error(f"Card upload failed with error code: {return_code}")

        except FileNotFoundError as e:
            self.update_status(f"Error: {SCRIPT_PATH} not found.")
            logging.error(f"Error: {SCRIPT_PATH} not found: {e}")
        except Exception as e:
            self.update_status(f"An error occurred: {e}")
            logging.exception(f"An error occurred: {e}")  # Log the full exception
        finally:
            # Re-enable the button
            self.master.after(0, lambda: self.enable_upload_button())

    def update_status(self, message):
        # Encode and decode the message to handle Unicode characters
        try:
            message = message.encode('utf-8', 'ignore').decode('utf-8')
        except Exception as e:
            logging.warning(f"Error encoding message: {e}")
        self.status_text.set(message)
        self.master.update_idletasks()  # Force update of the GUI

    def enable_upload_button(self):
        upload_button = self.master.grid_slaves(row=2, column=0)[0]  # Get the button instance
        upload_button['state'] = 'normal'  # Enable the button

if __name__ == "__main__":
    root = tk.Tk()
    gui = CardScannerGUI(root)
    root.mainloop()