Freelanc Hub – AI-Powered Freelance Marketplace

Freelanc Hub is a full-stack freelance marketplace platform built with React, Node.js, and Python (Flask).
It helps clients connect with freelancers efficiently using a ranking algorithm that prioritizes skill relevance, ratings, and efficiency.

🚀 Features
🔹 User Management

Separate Freelancer and Client accounts

Secure registration & login with authentication

Freelancer profile with skills, bio, rating & completion rate

🧠 AI-Based Ranking Algorithm

The platform uses a custom Python ranking algorithm to shortlist freelancers based on:

Skill match %

Success/completion rate

Average rating

Previous work performance

🔗 Project & Contract Management

Clients can post projects

Freelancers can bid

Dynamic ranking at project assignment stage

🖥️ Tech Stack
Layer	Technologies
Frontend	React.js
Backend API	Node.js
Ranking Engine	Python
Web Server	Flask
Database	SQLite
Deployment (tested)	Render, Docker (optional)
📂 Project Structure
Freelance_Marketplace-main/
│── backend/
│   ├── app/
│   │   ├── models.py          # Database Models
│   │   ├── schemas.py         # Input Validation
│   │   ├── routes.py          # API Endpoints
│   │   ├── ranking_logic.py   # Core Ranking Algorithm
│   │   ├── external/
│   │   │   └── freelancer.py  # Freelancer Logic Class
│   │   └── __init__.py
│   └── env/                   # Python Virtual Environment
│
│── frontend/
│   └── src/                   # React Components
│
└── .vscode/                   # IDE Settings

🛠️ Installation & Setup
1️⃣ Backend (Flask API + Ranking Engine)
cd backend
python -m venv env
source env/Scripts/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
flask run

2️⃣ Frontend (React)
cd frontend
npm install
npm start

3️⃣ Node.js API Server
cd backend
npm install
npm run dev

🔍 Ranking Algorithm – Overview
rank = (skill_match * 0.5) + (avg_rating * 0.3) + (completion_rate * 0.2)


Skill match – Evaluated based on relevance of freelancer skills to project requirements.

Average rating – Based on past client reviews.

Completion rate – Represents reliability.

The weights can be fine-tuned using test data for better results.

📌 Environment Variables

Create a .env file in backend/:

SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///site.db

📡 API Endpoints (Sample)
Method	Endpoint	Description
POST	/register	Register user
POST	/login	Authenticate user
POST	/project/create	Post a new project
POST	/rank/freelancers	Get ranked freelancer list
🔧 Deployment
Render / Docker Suggested Deployment

Containerize Flask app

Static hosting for React

Use SQLite / PostgreSQL (recommended for production)

📎 Future Enhancements

📊 Dashboard and analytics for freelancers

🔔 AI-based recommendation system

📱 Mobile App Support

🧾 Secure Payment Gateway Integration

🧑‍💻 Author

Somee Svaar V
B.E. – Computer Science, Bangalore Institute of Technology
🔗 Portfolio: (add your portfolio link if any)
📧 Email: someesvaar.v@gmail.com

📄 License

This project is licensed under the MIT License.
Feel free to use and contribute!

⭐ Contribution

Pull requests and feedback are welcome!
If you found this helpful, consider giving it a ⭐ on GitHub 😊
