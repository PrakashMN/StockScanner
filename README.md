# Stock Scanner

A web application that allows users to analyze stocks using technical indicators, powered by a React frontend and a Python Flask backend.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Git** (for version control and cloning)
- **Python 3.8+** (for the backend service)
- **Node.js 16+** and **npm** (for the frontend application)

## Getting Started

Follow these instructions to clone the project and run it on your local machine.

### 1. Clone the Repository

First, clone the repository to your local machine and navigate into the project directory:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd StockScanner
```

---

### 2. Backend Setup (Python)

The backend is built with Flask and requires its own set of dependencies. Open a terminal and navigate to the backend directory:

```bash
cd python-service
```

#### Step 2a: Create a Virtual Environment
It's highly recommended to use a virtual environment to manage dependencies securely without affecting your system packages.

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 2b: Install Dependencies
With the virtual environment activated, install the required Python packages:

```bash
pip install -r requirements.txt
```

#### Step 2c: Setup Environment Variables
Create a local `.env` file for configuration based on the provided example:

**On Windows:**
```bash
copy .env.example .env
```

**On macOS/Linux:**
```bash
cp .env.example .env
```
*(Optionally open the `.env` file in your editor and configure variables like `JWT_SECRET_KEY` if necessary).*

#### Step 2d: Run the Backend Server
Start the Flask application:

```bash
python app.py
```
*You should see output indicating the backend is running, generally at `http://127.0.0.1:5000`.*

---

### 3. Frontend Setup (React/Vite)

Open a **new separate terminal window** (leave the backend running in the previous one) and navigate to the frontend directory:

```bash
cd frontend
```

#### Step 3a: Install Node Modules
Install all required frontend dependencies using `npm`:

```bash
npm install
```

#### Step 3b: Start the Development Server
Run the Vite development server:

```bash
npm run dev
```

---

### 4. Access the Application

Once both servers are running successfully, open your web browser and navigate to the local Vite URL provided in the terminal (usually port 5173). 

**http://localhost:5173**
