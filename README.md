
# 📖 Bible API - Bible Study & Prayer App Backend

This backend system powers a **Bible study and prayer application**, allowing users to:
- **Access and search Bible verses**
- **Create and manage prayers**
- **Link prayers to Bible verses**
- **Authenticate users securely** using JWT

Built with **Express.js**, **MySQL**, and **JWT authentication**, hosted on **AWS Lightsail** with **Nginx reverse proxy**.

---

## 📌 Table of Contents
- [Features](#-features)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [API Documentation](#-api-documentation)
  - [User Authentication](#-user-authentication)
  - [Bible Verses](#-bible-verses)
  - [Prayer Management](#-prayer-management)
- [Running the Server](#-running-the-server)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🚀 Features
- **User Authentication** (Register, Login, JWT-based security)
- **Bible API** (Retrieve Bible verses by book, chapter, or verse)
- **Prayer Management** (Submit, view, and link prayers to Bible verses)
- **JWT Middleware** (Protect routes from unauthorized access)
- **Database Optimization** (Using MySQL for structured Bible data and prayer records)
- **Scalability & Security** (Hosted on AWS Lightsail with Nginx reverse proxy)

---

## ⚙️ Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/Darkpupil96/Bible-API.git
cd Bible-API
```

### 2️⃣ Install Dependencies
```sh
npm install
```

---

## 🔧 Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your-password
DB_NAME=bible
JWT_SECRET=your-jwt-secret-key
```

---

## 📂 Database Setup  
To set up the database, simply import the provided `bible_structure.sql` file instead of manually creating tables.

#### **Option 1: Using MySQL CLI**
Run the following command to import the database structure:
```sh
mysql -h localhost -u root -p < database/bible_structure.sql
```
If you are using a specific database user:
```sh
mysql -h localhost -u your-db-user -p < database/bible_structure.sql
```

#### **Option 2: Using MySQL Workbench**
1. Open **MySQL Workbench**.  
2. Go to **Server > Data Import**.  
3. Select **Import from Self-Contained File** and choose `database/bible_structure.sql`.  
4. Click **Start Import**.  

#### **Option 3: Using Docker MySQL**
If your MySQL is running in a Docker container:
```sh
docker cp database/bible_structure.sql your-mysql-container:/bible_structure.sql
docker exec -i your-mysql-container mysql -u root -p < /bible_structure.sql
```

Once the database is imported, you can verify the tables by running:
```sh
mysql -h localhost -u root -p -e "USE bible; SHOW TABLES;"
```
or describe a specific table:
```sh
mysql -h localhost -u root -p -e "USE bible; DESCRIBE users;"
```

Now your database is ready for use! 🚀

---

## 📜 **API Documentation**

This API documentation provides a structured overview of all available endpoints for user authentication, Bible verses, prayers, friends, and interactions (likes/comments).

---

## 🧑‍💻 **User Authentication**
#### **1. Register**
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

---

#### **2. Login**
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
    "token": "your_jwt_token"
  }
  ```

---

#### **3. Get Current User Info**
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
    "avatar": "http://localhost:5000/media/avatar.png",
    "language": "t_cn"
  }
  ```

---

#### **4. Update User Profile**
- **Endpoint:** `POST /api/auth/update`
- **Headers:**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Request Body:**
  ```json
  {
    "username": "JohnUpdated",
    "avatar": "http://localhost:5000/media/new-avatar.png",
    "language": "t_cn"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Profile updated successfully"
  }
  ```

---

### **5. Get Public User Information **
Endpoint: GET /api/auth/public/:id
URL Parameters:
:id (required) – The ID of the user.
Description:
Retrieve the specified user's basic information along with all their public prayers (prayers where is_private is false). This endpoint does not require authentication.
Example Request:
curl -X GET http://localhost:5000/api/auth/public/1
Example Response:
json

{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "http://localhost:5000/media/avatar.png",
    "language": "t_cn"
  },
  "publicPrayers": [
    {
      "id": 1,
      "title": "My Prayer",
      "content": "Dear God, bless my family.",
      "is_private": false,
      "created_at": "2025-03-02T12:34:56.000Z",
      "username": "john_doe",
      "verses": [
        {
          "version": "t_kjv",
          "b": 1,
          "c": 1,
          "v": 1,
          "text": "In the beginning God created the heaven and the earth."
        }
      ]
    }
  ]
}
Notes:
This endpoint only exposes public details. Private prayers are not included.

## 📖 **Bible Verses**
#### **6. Get Bible Verses**
- **Endpoint:** `GET /api/bible`
- **Query Parameters:**  
  - `book` (required) - Book number  
  - `chapter` (required) - Chapter number  
  - `verse` (optional) - Specific verse number  
  - `v` (required) - Bible version (`t_kjv` for KJV, `t_cn` for Chinese)  
- **Example:** `/api/bible?book=1&chapter=1&v=t_kjv`
- **Response:**
  ```json
  {
    "book": 1,
    "chapter": 1,
    "verse": "all",
    "version": "t_kjv",
    "verses": [
      { "verse": 1, "text": "In the beginning God created the heaven and the earth." },
      { "verse": 2, "text": "And the earth was without form, and void..." }
    ]
  }
  ```
#### **7. Search Bible Verses**
---
Chinese Verse Search
Endpoint: GET /api/bible/Chinese/search?word=xxx
Description:
Retrieves Bible verses from the Chinese Bible table (t_cn) that contain the specified keyword. The search uses a fuzzy match (SQL LIKE operator) to find verses where the text includes the search term.
Query Parameters:
word (required): The keyword to search for.
Example Request:

curl -X GET "http://localhost:5000/api/bible/Chinese/search?word=挪亚"
Example Response:
```json

{
  "verses": [
    {
      "version": "t_cn",
      "b": 1,
      "c": 1,
      "v": 1,
      "t": "在起初，神创造天地..."
    },
    {
      "version": "t_cn",
      "b": 1,
      "c": 1,
      "v": 2,
      "t": "地是空虚混沌..."
    }
    // ... additional matching verses
  ]
}
Notes:
The keyword is automatically wrapped with % on both sides (i.e., %keyword%) to enable fuzzy matching. Ensure your database is configured with UTF-8 encoding to support Chinese characters.

English Verse Search
Endpoint: GET /api/bible/English/search?word=xxx
Description:
Retrieves Bible verses from the English Bible table (t_kjv) that contain the specified keyword. The search uses a fuzzy match (SQL LIKE operator) to find verses where the text includes the search term.
Query Parameters:
word (required): The keyword to search for.
Example Request:
curl -X GET "http://localhost:5000/api/bible/English/search?word=love"
Example Response:
```json

{
  "verses": [
    {
      "version": "t_kjv",
      "b": 1,
      "c": 1,
      "v": 1,
      "t": "In the beginning, God created the heaven and the earth."
    },
    {
      "version": "t_kjv",
      "b": 1,
      "c": 1,
      "v": 2,
      "t": "And the earth was without form, and void..."
    }
    // ... additional matching verses
  ]
}
Notes:
The keyword is wrapped with % for fuzzy matching. Make sure your database is set to use UTF-8 encoding so that special characters are handled correctly.

---

## 🙏 **Prayers**
#### **8. Create a Prayer**

- **Endpoint:** `POST /api/prayers`
- **Headers:**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Request:**
  ```json
  {
    "title": "My Daily Prayer",
    "content": "Lord, give me strength.",
    "is_private": false,
    "verses": [
      { "version": "t_kjv", "b": 1, "c": 1, "v": 1 }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Prayer submitted",
    "prayerId": 1
  }
  ```

---

#### **9. Get All Public Prayers**
- **Endpoint:** `GET /api/prayers`
- **Response:**
  ```json
  {
    "prayers": [
      {
        "id": 1,
        "title": "Morning Prayer",
        "content": "Lord, guide me.",
        "is_private": false,
        "created_at": "2024-02-27T12:00:00",
        "username": "John"
      }
    ]
  }
  ```

---

#### **10. Get User’s Prayers**
- **Endpoint:** `GET /api/prayers/mine`
- **Headers:**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Response:** (Same format as above)

---

#### **11. Get a Specific User’s Public Prayers**
- **Endpoint:** `GET /api/prayers/user/{userId}`
- **Example:** `GET /api/prayers/user/2`
- **Response:**
  ```json
  {
    "prayers": [
      {
        "id": 2,
        "title": "Evening Prayer",
        "content": "Give me peace.",
        "is_private": false,
        "created_at": "2024-02-27T14:00:00",
        "username": "AnotherUser"
      }
    ]
  }
  ```

---

## 🤝 **Friendship System**
#### **12. Send a Friend Request**
- **Endpoint:** `POST /api/friends/add`
- **Headers:**
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Request Body:**
  ```json
  {
    "friend_id": 2
  }
  ```
- **Response:**
  ```json
  {
    "message": "Friend request sent!"
  }
  ```

---

#### **13. Get Friend Requests**
- **Endpoint:** `GET /api/friends/requests`
- **Headers:**  
  ```
  Authorization: Bearer your_jwt_token
  ```
- **Response:**
  ```json
  {
    "requests": [
      {
        "id": 1,
        "from": "JohnDoe",
        "status": "pending"
      }
    ]
  }
  ```

---

#### **14. Get Friend List**
- **Endpoint:** `GET /api/friends`
- **Response:**
  ```json
  {
    "friends": [
      {
        "id": 2,
        "username": "JaneDoe",
        "avatar": "http://localhost:5000/media/avatar2.png"
      }
    ]
  }
  ```

---

## ❤️ **Likes & Comments**
#### **15. Like a Prayer**
- **Endpoint:** `POST /api/prayers/{prayerId}/like`
- **Example:** `POST /api/prayers/5/like`
- **Response:**
  ```json
  {
    "message": "Prayer liked successfully!"
  }
  ```

---

#### **16. Unlike a Prayer**
- **Endpoint:** `DELETE /api/prayers/{prayerId}/unlike`
- **Example:** `DELETE /api/prayers/5/unlike`
- **Response:**
  ```json
  {
    "message": "Prayer unliked successfully!"
  }
  ```

---

#### **17. Get Prayer Likes Count**
- **Endpoint:** `GET /api/prayers/{prayerId}/likes`
- **Example:** `GET /api/prayers/5/likes`
- **Response:**
  ```json
  {
    "likeCount": 10
  }
  ```

---

#### **18. Add a Comment on a Prayer**
- **Endpoint:** `POST /api/prayers/{prayerId}/comment`
- **Request:**
  ```json
  {
    "content": "Beautiful prayer!"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Comment added successfully!"
  }
  ```

---

#### **19. Get Comments for a Prayer**
- **Endpoint:** `GET /api/prayers/{prayerId}/comments`
- **Example:** `GET /api/prayers/5/comments`
- **Response:**
  ```json
  {
    "comments": [
      {
        "id": 1,
        "content": "Beautiful prayer!",
        "created_at": "2024-02-27T14:10:00",
        "username": "JaneDoe"
      }
    ]
  }
  ```

---
#### **20.Get All Public Prayers**
Endpoint: GET /api/prayers/public
Description:
Retrieve all public prayers from the database along with any associated Bible verse information. No authentication is required.
Example Request:
sh
复制
curl -X GET http://localhost:5000/api/prayers/public
Example Response:
json
复制
{
  "prayers": [
    {
      "id": 1,
      "title": "My Prayer",
      "content": "Dear God, bless my family.",
      "is_private": false,
      "created_at": "2025-03-02T12:34:56.000Z",
      "username": "john_doe",
      "verses": [
        {
          "version": "t_kjv",
          "b": 1,
          "c": 1,
          "v": 1,
          "text": "In the beginning God created the heaven and the earth."
        }
      ]
    }
    // ... additional public prayers
  ]
}
Notes:
Only prayers with is_private = false are returned by this endpoint.


## ▶️ Running the Server
```sh
npm start
```
The server will run on **http://localhost:5000**

---

## 🚀 Deployment
### **🔧 AWS Lightsail Deployment Guide (Secure & Optimized)**
This guide provides step-by-step instructions to deploy the **Bible API** backend on **AWS Lightsail** with **Node.js**, **MySQL**, **PM2**, **Nginx**, and **Let's Encrypt SSL**.

---

## **1️⃣ Connect to AWS Lightsail via SSH**
First, download your **SSH private key** from AWS Lightsail.

Run the following command to connect to your AWS server:
```sh
ssh -i "/path-to-your-key/bible-project-key.pem" ubuntu@your-server-ip
```
> Replace `/path-to-your-key/bible-project-key.pem` with your actual key location.  
> Replace `your-server-ip` with your AWS instance public IP.

If you're using **Windows PowerShell**, ensure the private key has proper permissions:
```powershell
icacls "D:\AWS\bible-project-key.pem" /inheritance:r
icacls "D:\AWS\bible-project-key.pem" /grant:r "%USERNAME%:R"
icacls "D:\AWS\bible-project-key.pem" /remove "BUILTIN\Users"
```

---

## **2️⃣ Update & Upgrade Ubuntu**
Ensure your system is updated:
```sh
sudo apt update && sudo apt upgrade -y
```

---

## **3️⃣ Install Node.js**
Since the backend is built with **Node.js + Express**, install the latest **Node.js** version:
```sh
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```
Verify the installation:
```sh
node -v
npm -v
```

---

## **4️⃣ Upload Your Backend Code**
On your **local machine**, upload your project to the AWS server:
```sh
scp -i "/path-to-your-key/bible-project-key.pem" -r "/path-to-your-local-code/bible-backend" ubuntu@your-server-ip:/home/ubuntu/
```
Then, on the **server**, move into the project directory:
```sh
cd ~/bible-backend
```

---

## **5️⃣ Install Dependencies**
Navigate to the uploaded project and install required dependencies:
```sh
cd ~/bible-backend
npm install
```

---

## **6️⃣ Run API in the Background with PM2**
Install **PM2** globally:
```sh
sudo npm install -g pm2
```
Start your API:
```sh
pm2 start app.js --name "bible-api"
```
Ensure the process runs on reboot:
```sh
pm2 save
pm2 startup
```

Now, your API will continue running even after closing the SSH session.

---

## **7️⃣ Allow Public Access to the API**
### **Step 1: Open Port 5000 on the Server**
```sh
sudo ufw allow 5000
sudo ufw reload
```
### **Step 2: Configure AWS Lightsail Firewall**
1. Go to **AWS Lightsail Console** → Select your instance.  
2. Navigate to **Networking** → **Firewall rules**.  
3. Add a new rule:
   - **Application:** Custom  
   - **Port Range:** `5000`  
   - **Protocol:** TCP  
   - **Source:** `0.0.0.0/0`  
   - Click **Save**  

### **Step 3: Update `app.js` to Listen on All IPs**
On the **server**, edit `app.js`:
```sh
cd src
nano app.js
```
Ensure this line is present:
```js
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
```
Save (`CTRL + X → Y → Enter`) and restart the API:
```sh
pm2 restart bible-api
```

---

## **8️⃣ Import MySQL Database**


### **Step 1: Import Database on AWS Server**
Log in to your server:
```sh
ssh -i "/path-to-your-key/bible-project-key.pem" ubuntu@your-server-ip
```
Then, import the database:
```sh
sudo mysql -u root -p
CREATE DATABASE bible;
EXIT;
mysql -u root -p bible < /home/ubuntu/bible.sql
```

### **Step 2: Restart the API**
```sh
pm2 restart bible-api
```

### **Step 3: Test the API**
```sh
curl "http://localhost:5000/api/bible?book=2&chapter=10&v=t_cn"
```

---

## **9️⃣ Configure MySQL Authentication**
By default, MySQL may use `auth_socket`, which can cause authentication issues.

### **Step 1: Change Root Authentication**
```sh
sudo mysql
```
Run the following SQL commands:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_new_password';
FLUSH PRIVILEGES;
EXIT;
```
> Replace `your_new_password` with your actual MySQL password.

### **Step 2: Reimport the Database**
```sh
mysql -u root -p bible < /home/ubuntu/bible.sql
```

### **Step 3: Restart API**
```sh
pm2 restart bible-api
```

---

## **🔐 10. Enable HTTPS with Let’s Encrypt SSL**
To enable HTTPS, install **Certbot**:
```sh
sudo apt install certbot python3-certbot-nginx -y
```
Run the following command to generate an SSL certificate:
```sh
sudo certbot --nginx -d your-domain.com
```
> Replace `your-domain.com` with your actual domain.

In your **DNS provider settings**, update the **A Record** to point to your AWS Lightsail IP.

---

## **🔁 11. Configure Nginx Reverse Proxy**
Edit the Nginx config file:
```sh
sudo nano /etc/nginx/sites-available/default

```
Paste the following configuration:
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
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'keep-alive';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media/ {
    root /home/ubuntu/bible-backend/src/;
    autoindex on;
    access_log off;
    expires max;
}

}
```
Save and restart Nginx:
```sh
sudo nginx -t
sudo systemctl restart nginx
```

---

## **✅ 12. Test the API**
Run the following command to verify HTTPS:
```sh
curl -v "https://your-domain.com/api/bible?book=1&chapter=1&v=t_cn"
```

---

### **🎯 Summary**
✔ **Secure API hosting on AWS Lightsail**  
✔ **Automated background process with PM2**  
✔ **MySQL database configuration & import**  
✔ **Nginx reverse proxy setup**  
✔ **HTTPS enabled with Let’s Encrypt**  

Now, your **Bible API** is fully deployed and ready to use! 🚀

## 📄 License
This project is licensed under the MIT License.

---

## ✉️ Contact
For any questions, feel free to reach out!
Email: yzh1996au@gmail.com
---
```

---
