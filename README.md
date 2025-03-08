
# 📖 Bible API - Bible Study & Prayer App Backend

This backend system powers a **Bible study and prayer application**, allowing users to:
- **Access and search Bible verses**
- **Create and manage prayers**
- **Link prayers to Bible verses**
- **Authenticate users securely** using JWT
- **Update account settings**, including profile information, avatar upload, and reading progress

Built with **Express.js**, **MySQL**, and **JWT authentication**, hosted on **AWS Lightsail** with **Nginx reverse proxy**.

---

## 📌 Table of Contents
- [Features](#-features)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [API Documentation](#-api-documentation)
  - [User Authentication & Account Settings](#-user-authentication--account-settings)
  - [Bible Verses](#-bible-verses)
  - [Prayer Management](#-prayer-management)
  - [Friendship & Interaction](#-friendship--interaction)
- [Running the Server](#-running-the-server)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🚀 Features
- **User Authentication & Account Settings**
  - Register, login, and retrieve current user information.
  - Update user profile (username, avatar, language) via account settings.
  - Upload avatar: After login, users can upload an image which is automatically set as their avatar.
  - Update reading progress: Users can update the current Bible book and chapter they are reading.
- **Bible API**
  - Retrieve Bible verses by book, chapter, and optional verse; supports multiple Bible versions.
  - Search Bible verses using keywords (supports both Chinese and English).
- **Prayer Management**
  - Create, view, and link prayers to Bible verses.
- **Friendship & Interaction**
  - Send/accept friend requests, like and comment on prayers.
- **JWT Middleware**
  - Protect routes from unauthorized access.
- **Scalability & Security**
  - Hosted on AWS Lightsail with Nginx reverse proxy.
- **File Uploads**
  - Avatar images are uploaded and stored in `src/media` and served via Nginx.

---

## ⚙️ Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/YourGitHubUsername/Bible-API.git
cd Bible-API
```

### 2️⃣ Install Dependencies
```sh
npm install
```

---

## 🔧 Environment Variables
Create a `.env` file in the root directory with the following content:
```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your-password
DB_NAME=bible_db
JWT_SECRET=your-jwt-secret-key
BASE_URL=https://withelim.com
```
> Ensure `BASE_URL` is set correctly so that user avatar URLs are generated with the correct domain.

---

## 📂 Database Setup  
Import the provided `bible_structure.sql` file to set up the database schema.

### Option 1: Using MySQL CLI
```sh
mysql -h localhost -u root -p bible_db < database/bible_structure.sql
```

### Option 2: Using MySQL Workbench  
Follow the standard data import process.

---

## 📜 API Documentation

# 📖 Bible API - Bible Study & Prayer App Backend

This backend system powers a **Bible study and prayer application**, allowing users to:
- **Access and search Bible verses**
- **Create and manage prayers**
- **Link prayers to Bible verses**
- **Authenticate users securely** using JWT
- **Manage friendships (send requests, accept/reject, view friends list)**
- **Update account settings**, including profile information, avatar upload, email, language, and password

Built with **Express.js**, **MySQL**, and **JWT authentication**, hosted on **AWS Lightsail** with **Nginx reverse proxy**.

---

## 📜 API Documentation

### 🧑‍💻 User Authentication & Account Management

#### 1️⃣ Register
- **Endpoint:** `POST /api/auth/register`
- **Request:**
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully"
  }
  ```

#### 2️⃣ Login
- **Endpoint:** `POST /api/auth/login`
- **Request:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response:**
  ```json
  {
    "token": "your_jwt_token",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "avatar": "https://withelim.com/media/avatar.png",
      "language": "t_cn"
    }
  }
  ```

#### 3️⃣ Get Current User Info
- **Endpoint:** `GET /api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Response:**
  ```json
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "https://withelim.com/media/avatar.png",
    "language": "t_cn",
    "reading_book": 1,
    "reading_chapter": 3
  }
  ```

#### 4️⃣ Update Profile (Username, Email, Password, Avatar & Language)
- **Endpoint:** `POST /api/auth/update`
- **Request:**
  ```json
  {
    "username": "JohnUpdated",
    "email": "newemail@example.com",
    "avatar": "https://withelim.com/media/new-avatar.png",
    "language": "t_cn",
    "oldPassword": "oldpassword",
    "newPassword": "newsecurepassword"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Profile updated successfully",
    "user": {
      "id": 1,
      "username": "JohnUpdated",
      "email": "newemail@example.com",
      "avatar": "https://withelim.com/media/new-avatar.png",
      "language": "t_cn"
    }
  }
  ```

#### 5️⃣ Upload Avatar
- **Endpoint:** `POST /api/auth/upload-avatar`
- **Response:**
  ```json
  {
    "message": "Avatar uploaded and updated successfully",
    "user": {
      "id": 1,
      "avatar": "https://withelim.com/media/avatar_1.jpg"
    }
  }
  ```

#### 6️⃣ Get Public Profile
- **Endpoint:** `GET /api/auth/public/:id`
- **Response:**
  ```json
  {
    "user": {
      "id": 2,
      "username": "jane_doe",
      "email": "jane@example.com",
      "avatar": "https://withelim.com/media/jane-avatar.png",
      "language": "t_cn"
    },
    "publicPrayers": [
      {
        "id": 1,
        "title": "Jane's Prayer",
        "content": "This is Jane's prayer content.",
        "created_at": "2024-03-07T12:00:00Z"
      }
    ]
  }
  ```

### 📖 Bible Verses

#### 1️⃣ Get Bible Verses
- **Endpoint:** `GET /api/bible`
- **Response:**
  ```json
  {
    "book": 1,
    "chapter": 1,
    "version": "t_kjv",
    "verses": [
      { "verse": 1, "text": "In the beginning God created the heaven and the earth." }
    ]
  }
  ```

#### 2️⃣ Search Bible Verses
- **Endpoint:** `GET /api/bible/English/search?word=noah`
- **Response:**
  ```json
  {
    "verses": [
      { "version": "t_kjv", "b": 1, "c": 6, "v": 8, "t": "But Noah found grace in the eyes of the LORD." }
    ]
  }
  ```

### 🙏 Prayer Management

#### 1️⃣ Create Prayer
- **Endpoint:** `POST /api/prayers`
- **Response:**
  ```json
  {
    "message": "Prayer submitted",
    "prayerId": 1
  }
  ```

#### 2️⃣ Get Public Prayers
- **Endpoint:** `GET /api/prayers/public`
- **Response:**
  ```json
  {
    "prayers": [
      {
        "id": 1,
        "title": "My Prayer",
        "content": "This is my prayer content."
      }
    ]
  }
  ```

### 🤝 Friendship System

#### 1️⃣ Send Friend Request
- **Endpoint:** `POST /api/friends/add`
- **Response:**
  ```json
  {
    "message": "Friend request sent!"
  }
  ```

#### 2️⃣ Get Friends List
- **Endpoint:** `GET /api/friends/list`
- **Response:**
  ```json
  {
    "friends": [{ "id": 2, "username": "jane_doe" }]
  }
  ```

#### 3️⃣ Accept or Reject Friend Request
- **Endpoint:** `POST /api/friends/respond`
- **Request:**
  ```json
  {
    "friendshipId": 1,
    "status": "accepted"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Friend request accepted!"
  }
  ```




## ▶️ Running the Server
```sh
npm start
```
The server runs on **http://localhost:5000** by default.

---

## 🚀 Deployment
### **AWS Lightsail Deployment Guide**
1. **Connect via SSH:**  
   ```sh
   ssh -i "/path-to-your-key/bible-project-key.pem" ubuntu@your-server-ip
   ```
2. **Upload your code to the server:**  
   ```sh
   scp -i "/path-to-your-key/bible-project-key.pem" -r /local/path/to/Bible-API ubuntu@your-server-ip:/home/ubuntu/
   ```
3. **Install dependencies and run:**  
   ```sh
   cd /home/ubuntu/Bible-API
   npm install
   pm2 start app.js --name "bible-api"
   pm2 save
   pm2 startup
   ```
4. **Configure Nginx Reverse Proxy:**  
   Set up Nginx to proxy API requests and serve `/media/`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       return 301 https://$host$request_uri;
   }
   
   server {
       listen 443 ssl;
       server_name your-domain.com www.your-domain.com;
   
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
   
       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   
       location /media/ {
           alias /home/ubuntu/Bible-API/src/media/;
           autoindex on;
           expires max;
       }
   }
   ```
   Then reload Nginx:
   ```sh
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 📄 License
This project is licensed under the MIT License.

---

## ✉️ Contact
For any questions, please reach out at:  
Email: yzh1996au@gmail.com

---
