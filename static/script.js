const API_URL = "http://127.0.0.1:5000"; // Backend URL
const socket = io(); // Connect to the WebSocket 
const chatBox = document.getElementById("chat-box");
if (!chatBox) {
    console.error("Chat box element not found");
}
console.log("WebSocket connection status:", socket.readyState);

console.log("Chat box element:", document.getElementById("chat-box"));
 
// Function to load data from Flask API
async function loadData() {
    let response = await fetch(`${API_URL}/get-data`);
    let data = await response.json();

    displayPosts(data.posts);


    displayBirthdays(data.birthdays);


    checkForBirthdayReminder(data.birthdays);
}

async function clearData() {
    let confirmDelete = confirm("Are you sure you want to delete all posts and birthdays?");
    if (!confirmDelete) return;

    await fetch(`${API_URL}/clear-data`, { method: "POST" });

    loadData(); // Reload the empty state
}


// Function to add a post
async function addPost() {
    let postInput = document.getElementById("postInput").value.trim();
    if (postInput === "") return;

    await fetch(`${API_URL}/add-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: postInput })
    });

    document.getElementById("postInput").value = "";
    loadData(); // Reload posts
}

// Function to display posts
function displayPosts(posts) {
    let postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = "";

    console.log("Displaying Posts:", posts); // ✅ Debugging: Print posts to console
    
    posts.forEach(post => {
        if (typeof post === "string") {
            // Handle old format (when posts were stored as plain strings)
            post = { content: post, date: "Unknown Date" };
        }

        let postElement = document.createElement("div");
        postElement.classList.add("post");

        postElement.innerHTML = `
            <div class="post-content">${post.content}</div>
            <div class="post-date">${post.date}</div>
        `;

        postsDiv.appendChild(postElement);
    });
}

// Function to add a birthday
async function addBirthday() {
    let name = document.getElementById("nameInput").value.trim();
    let birthday = document.getElementById("birthdayInput").value;

    if (name === "" || birthday === "") return;

    await fetch(`${API_URL}/add-birthday`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, date: birthday })
    });

    document.getElementById("nameInput").value = "";
    document.getElementById("birthdayInput").value = "";
    loadData(); // Reload birthdays
}

// Function to format and display birthdays
function displayBirthdays(birthdays) {
    let birthdayDiv = document.getElementById("birthdays");
    birthdayDiv.innerHTML = ""; // Clear previous content

    console.log("Displaying Birthdays:", birthdays); // ✅ Debugging: Print birthdays to console


    birthdays.forEach(birthday => {
        let formattedDate = formatDate(birthday.date);
        let birthdayElement = document.createElement("div");
        birthdayElement.classList.add("birthday");
        birthdayElement.innerHTML = `<strong>${birthday.name}</strong> - ${formattedDate}`;
        birthdayDiv.appendChild(birthdayElement);
    });
}

// Function to format the date to "Month Day, Year"
function formatDate(dateString) {
    let options = { year: "numeric", month: "long", day: "numeric" };
    let date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", options).format(date);
}



// Function to send a chat message
function sendMessage() {
    const message = document.getElementById("chat-message").value.trim();
    if (!message) return;

    socket.send(message); // Send the message via WebSocket
    document.getElementById("chat-message").value = ""; // Clear the input field
}

// Function to display chat messages
function displayChatMessage(message) {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
}

// Listen for incoming chat messages
socket.on("message", (data) => {
    displayChatMessage(`${data.user}: ${data.message}`);
});

// Load existing chat messages on page load
async function loadChatMessages() {
    const response = await fetch(`${API_URL}/get-chat-messages`);
    const data = await response.json();
    data.chat_messages.forEach(msg => {
        displayChatMessage(`${msg.user}: ${msg.message}`);
    });
}

// Load data and chat messages on page load
window.onload = function () {
    loadData();
    loadChatMessages();

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
};
// Function to check for birthday reminders
function checkForBirthdayReminder(birthdays) {
    let today = new Date();
    let todayFormatted = today.toISOString().slice(5, 10); // Extract "MM-DD"

    birthdays.forEach(birthday => {
        let birthdayFormatted = birthday.date.slice(5, 10); // Extract "MM-DD"

        if (todayFormatted === birthdayFormatted) {
            showBirthdayNotification(birthday.name);
        }
    });
}

// Function to show a birthday notification
function showBirthdayNotification(name) {
    if (Notification.permission === "granted") {
        new Notification("🎉 Birthday Reminder!", {
            body: `Today is ${name}'s birthday! 🎂`,
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("🎉 Birthday Reminder!", {
                    body: `Today is ${name}'s birthday! 🎂`,
                });
            }
        });
    }
}

// Load data on page load
window.onload = function () {
    loadData();

    // Request notification permission on load
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
};



