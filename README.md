# Freelance Hub – AI-Powered Freelance Marketplace

Freelance Hub is a full-stack freelance marketplace platform built with React, Node.js, and Python (Flask). It connects clients with freelancers efficiently using a custom ranking algorithm based on skill relevance, ratings, and efficiency.

## 🚀 Features

### 🔹 User Management
- Separate Freelancer and Client accounts  
- Secure registration & login  
- Freelancer profile with skills, bio, rating & completion rate  

### 🧠 Ranking Algorithm
Ranks freelancers based on:
- Skill match percentage  
- Success/completion rate  
- Average rating  
- Previous project performance  

### 🔗 Project Management
- Clients can post projects  
- Freelancers can bid  
- Freelancers dynamically ranked per assignment  

## 🖥️ Tech Stack

Frontend: React.js  
Backend API: Node.js  
Ranking Engine: Python  
Web Server: Flask  
Database: SQLite  
Deployment Support: Render, Docker (optional)

## 📂 Project Structure

Freelance_Marketplace-main/  
├── backend/  
│   ├── app/  
│   │   ├── models.py  
│   │   ├── schemas.py  
│   │   ├── routes.py  
│   │   ├── ranking_logic.py  
│   │   ├── external/  
│   │   │   └── freelancer.py  
│   │   └── __init__.py  
│   └── env/  
├── frontend/  
│   └── src/  
└── .vscode/

## 🛠️ Installation & Setup

### 1️⃣ Backend (Flask API + Ranking Engine)

cd backend  
python -m venv env  
source env/Scripts/activate  (Windows: env\Scripts\activate)  
pip install -r requirements.txt  
flask run  

### 2️⃣ Frontend (React)

cd frontend  
npm install  
npm start  
npm run dev

### 3️⃣ Node.js API Server

cd backend  
python run_web.py  

## 📌 Environment Variables

Create a `.env` file in the backend directory:

SECRET_KEY=your_secret_key  
DATABASE_URL=sqlite:///site.db

## 📡 Sample API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /register | Register user |
| POST   | /login | Authenticate user |
| POST   | /project/create | Create project |
| POST   | /rank/freelancers | Rank freelancers |

## 🔧 Deployment

Recommended:  
- Containerize backend with Docker  
- Deploy frontend on Render/Netlify  
- Use PostgreSQL for production-level database  

## 📎 Future Enhancements

- Dashboard & analytics for freelancers  
- AI-based recommendation system  
- Payment integration  
- Mobile App support  

## 🧑‍💻 Author

**Someesvaar V**  
Bachelor of Engineering – Computer Science (BIT Bengaluru)  
Email: someesvaar.v@gmail.com  
LinkedIn / Portfolio: https://someesvaar.github.io/MyFirstWebsite/

## ⭐ Contributions

Contributions, feedback, and ideas are welcome!  
If you found this project helpful, please ⭐ star the repo on GitHub.
