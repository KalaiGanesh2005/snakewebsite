from flask import Flask, render_template, request
import cv2, numpy as np, pyautogui, time, tempfile, os, smtplib, ssl
from email.message import EmailMessage
from PIL import ImageGrab
from threading import Thread
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# Email credentials
sender_email = os.getenv("SENDER_EMAIL")
receiver_email = os.getenv("RECEIVER_EMAIL")
password = os.getenv("EMAIL_PASSWORD")

# Repeated screen capture and email loop
def capture_and_send_loop(interval=60):
    while True:
        try:
            print("[INFO] Capturing and recording...")

            # Temporary paths
            temp_dir = tempfile.gettempdir()
            screenshot_path = os.path.join(temp_dir, "screenshot.png")
            video_path = os.path.join(temp_dir, "screen_recording.avi")

            # Screenshot
            ImageGrab.grab().save(screenshot_path)

            # Screen Recording
            fps = 12.0
            duration = 10
            screen_size = pyautogui.size()
            out = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*"XVID"), fps, screen_size)
            end_time = time.time() + duration

            while time.time() < end_time:
                frame = cv2.cvtColor(np.array(pyautogui.screenshot()), cv2.COLOR_RGB2BGR)
                out.write(frame)
            out.release()

            # Compose email
            msg = EmailMessage()
            msg['Subject'] = "Automated Capture"
            msg['From'] = sender_email
            msg['To'] = receiver_email
            msg.set_content("Automated screenshot and screen recording attached.")

            with open(screenshot_path, 'rb') as f:
                msg.add_attachment(f.read(), maintype='image', subtype='png', filename='screenshot.png')
            with open(video_path, 'rb') as f:
                msg.add_attachment(f.read(), maintype='video', subtype='x-msvideo', filename='recording.avi')

            with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context()) as smtp:
                smtp.login(sender_email, password)
                smtp.send_message(msg)

            print("[INFO] Email sent successfully.")
        except Exception as e:
            print(f"[ERROR] {e}")
        
        time.sleep(interval)  # Wait before next cycle

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start():
    Thread(target=capture_and_send_loop, args=(300,), daemon=True).start()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)
