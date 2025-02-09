from flask import Flask, request, jsonify, render_template,session
import json
import os
from flask_socketio import SocketIO, send
import bcrypt
from datetime import datetime

app = Flask(__name__, static_folder='static')

socketio = SocketIO(app, cors_allowed_origins="*")

DATA_FILE = "data.json"


# Load or initialize data
def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    return {"users": [], "posts": [], "birthdays": [], "chat_messages": []}

# Save data to file
def save_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

# Ensure data file exists
if not os.path.exists(DATA_FILE):
    save_data({"posts": [], "birthdays": []})

# Serve the frontend
@app.route("/")
def home():
    return render_template("index.html")


# Chat Message Handling
@socketio.on("message")
def handle_message(msg):
    print("Received message:", msg)  # Debugging: Print the received message
    data = load_data()
    chat_entry = {"user": msg["user"], "message": msg["message"]}  # Store user and message
    data["chat_messages"].append(chat_entry)
    save_data(data)
    send(chat_entry, broadcast=True)

# Get Chat Messages
@app.route("/get-chat-messages", methods=["GET"])
def get_chat_messages():
    data = load_data()
    return jsonify({"chat_messages": data["chat_messages"]}), 200

@app.route("/clear-data", methods=["POST"])
def clear_data():
    empty_data = {"posts": [], "birthdays": []}  # Empty data structure
    save_data(empty_data)  # Overwrite the JSON file
    return jsonify({"message": "All data has been cleared"}), 200


# API to get all data (posts & birthdays)
@app.route("/get-data", methods=["GET"])
def get_data():
    data = load_data()
    return jsonify(data)

# API to add a new post
@app.route("/add-post", methods=["POST"])
def add_post():
    data = load_data()
    new_post = request.json.get("post")
    print("Received Post:", new_post)  # Debugging print statement

    
    if new_post:
        post_entry = {
            "content": new_post,
            "date": datetime.now().strftime("%B %d, %Y")  # Format: "February 10, 2025"
        }
        data["posts"].insert(0, post_entry)  # Add to the beginning
        save_data(data)
        return jsonify({"message": "Post added successfully"}), 200
    return jsonify({"error": "Post content is required"}), 400

# API to add a new birthday
@app.route("/add-birthday", methods=["POST"])
def add_birthday():
    data = load_data()
    name = request.json.get("name")
    date = request.json.get("date")

    if name and date:
        formatted_date = datetime.strptime(date, "%Y-%m-%d").strftime("%Y-%m-%d")
        data["birthdays"].append({"name": name, "date": formatted_date})
        save_data(data)
        return jsonify({"message": "Birthday added successfully"}), 200

    return jsonify({"error": "Name and date are required"}), 400

# Run the Flask app
if __name__ == "__main__":
     socketio.run(app, allow_unsafe_werkzeug=True)
