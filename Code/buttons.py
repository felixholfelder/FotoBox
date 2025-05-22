import asyncio
import websockets
import RPi.GPIO as GPIO
import time
import subprocess
from subprocess import Popen

# GPIO-Nummerierung verwenden (BCM-Mode)
GPIO.setmode(GPIO.BCM)

# Pin-Nummern
BUTTON1_PIN = 17  # Beispiel-Pin-Nummer für Button 1 ('c')
BUTTON2_PIN = 27  # Beispiel-Pin-Nummer für Button 2 ('s')

# Setup der GPIO-Pins als Eingänge mit Pull-Up-Widerständen
GPIO.setup(BUTTON1_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(BUTTON2_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def print_image(image_path):
    """Funktion zum Drucken eines Bildes über den lp-Befehl."""
    try:
        subprocess.run(['lp', '-o', 'fit-to-page', image_path], check=True)
        print(f"Druckauftrag erfolgreich gesendet fücccr {image_path}.")
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Drucken: {e}")

async def send_key(websocket):
    print("Client connected")
    try:
        while True:
            button1_state = GPIO.input(BUTTON1_PIN)
            button2_state = GPIO.input(BUTTON2_PIN)

            if button1_state == GPIO.LOW:
                print("Button 1 pressed")
                await websocket.send("c")
                print("Sent 'c' key")
                time.sleep(0.1)  # Debounce-Zeit

            if button2_state == GPIO.LOW:
                print("Button 2 pressed")
                await websocket.send("s")
                print("Sent 's' key")
                # Empfang des Dateipfads vom WebSocket-Client
                file_name = await websocket.recv()
                time.sleep(2)
                print_image("/home/admin/Downloads/" + file_name)
                time.sleep(0.1)  # Debounce-Zeit

            time.sleep(0.1)  # CPU-Last reduzieren
    except Exception as e:
        print(f"Exception: {e}")
    finally:
        print("Client disconnected")

async def main():
    p = Popen(['firefox', '/home/pi/fotobox/Code/Fotobox.html'])
    print("Browser-App started!")
    async with websockets.serve(send_key, "localhost", 8765):
        await asyncio.Future()  # run forever

asyncio.run(main())
