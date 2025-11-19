# Freelanc Hub – AI-Powered Freelance Marketplace

Freelanc Hub is a **full-stack freelance marketplace platform** built with **React, Node.js, and Python (Flask)**.  
It helps clients connect with freelancers efficiently using a **ranking algorithm** that prioritizes skill relevance, ratings, and efficiency.

---

## 🚀 Features

### 🔹 User Management
- Separate **Freelancer and Client accounts**
- Secure registration & login with authentication
- Freelancer profile with **skills, bio, rating & completion rate**

### 🧠 AI-Based Ranking Algorithm
The platform uses a **custom Python ranking algorithm** to shortlist freelancers based on:
- Skill match percentage  
- Success/completion rate  
- Average rating  
- Previous work performance  

### 🔗 Project & Contract Management
- Clients can post projects
- Freelancers can bid
- Ranking happens dynamically during project assignment

---

## 🖥️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React.js |
| Backend API | Node.js |
| Ranking Engine | Python |
| Web Server | Flask |
| Database | SQLite |
| Deployment (tested) | Render, Docker (optional) |

---

## 📂 Project Structure

📂 Project Structure

Freelance_Marketplace-main/
├── backend/
│ ├── app/
│ │ ├── models.py
│ │ ├── schemas.py
│ │ ├── routes.py
│ │ ├── ranking_logic.py
│ │ ├── external/
│ │ │ └── freelancer.py
│ │ └── init.py
│ └── env/
├── frontend/
│ └── src/
