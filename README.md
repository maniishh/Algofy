# Algofy: DSA Problem Tracking & Goal Setting
<!-- Placeholder for your project logo if you have one -->
## Table of Contents

* [About the Project](#about-the-project)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
    * [Database Setup](#database-setup)
    * [Running the Application](#running-the-application)
* [Usage](#usage)
* [Project Structure](#project-structure)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)
* [Acknowledgments](#acknowledgments)

## About the Project

Algofy is a full-stack web application designed to help Data Structures and Algorithms (DSA) enthusiasts track their problem-solving progress across various platforms and set personal goals. Whether you're preparing for interviews, improving your coding skills, or just want to stay consistent, Algofy provides a streamlined way to log solved questions and monitor your daily, weekly, or monthly targets.

This project aims to provide a simple yet effective tool for consistency and motivation in your DSA journey.

## Features

* **Track Solved Questions:** Easily record details of DSA problems solved (e.g., question name, platform, date solved).
* **Set Custom Goals:** Define daily, weekly, or monthly targets for the number of questions you aim to solve.
* **Progress Monitoring:** View your progress against set goals to stay motivated and identify areas for improvement.
* **User-Friendly Interface:** An intuitive web interface for seamless interaction.

## Tech Stack

* **Backend:**
    * [Node.js](https://nodejs.org/): JavaScript runtime
    * [Express.js](https://expressjs.com/): Web application framework for Node.js
* **Database:**
    * [PostgreSQL](https://www.postgresql.org/): Powerful, open-source relational database
* **Frontend:**
    * EJS
    * Tailwind
    * JavaScript

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/en/download/) (LTS recommended)
* [npm](https://www.npmjs.com/get-npm) (Node Package Manager, comes with Node.js)
* [PostgreSQL](https://www.postgresql.org/download/)
* [pgAdmin](https://www.pgadmin.org/download/) (Optional, but recommended for database management)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/algofy.git](https://github.com/your-username/algofy.git)
    cd algofy
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

### Database Setup

1.  **Create a PostgreSQL database:**
    Open `pgAdmin` or use the `psql` command line to create a new database.
    ```sql
    -- Example psql command
    CREATE DATABASE algofy_db;
    CREATE USER algofy_user WITH PASSWORD 'your_secure_password';
    GRANT ALL PRIVILEGES ON DATABASE algofy_db TO algofy_user;
    ```
    **Note:** Replace `algofy_db` and `algofy_user` and `your_secure_password` with your desired values.

2.  **Configure Environment Variables:**
    Create a `.env` file in the root of your project. This file will store your database connection details and other sensitive information.
    ```
    # .env
    PORT=3000
    DB_USER=algofy_user
    DB_HOST=localhost
    DB_DATABASE=algofy_db
    DB_PASSWORD=your_secure_password
    DB_PORT=5432
    ```
    **Important:** Replace the placeholder values with your actual PostgreSQL credentials.

3.  **Run Database Migrations (if applicable):**
    If you're using a migration tool (like Knex.js, Sequelize CLI), run your migrations to set up the database schema.
    *(If you haven't implemented migrations yet, you would manually create tables via pgAdmin or SQL scripts. For production, migrations are highly recommended.)*
    ```bash
    # Example if using Knex.js
    npx knex migrate:latest
    ```
    *(If no migration tool is used, consider adding SQL scripts for table creation here, e.g., `schema.sql`)*

    **Example SQL Schema (put this in a file like `schema.sql` and note how to run it):**
    ```sql
    -- schema.sql
    CREATE TABLE IF NOT EXISTS solved_questions (
        id SERIAL PRIMARY KEY,
        question_name VARCHAR(255) NOT NULL,
        platform VARCHAR(100),
        date_solved DATE DEFAULT CURRENT_DATE,
        difficulty VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        goal_type VARCHAR(50) NOT NULL, -- e.g., 'daily', 'weekly', 'monthly'
        target_count INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL
    );
    ```
    You would run this manually via pgAdmin or `psql -U algofy_user -d algofy_db -f schema.sql`.

### Running the Application

1.  **Start the server:**
    ```bash
    npm start
    ```
    or if you have a dev script:
    ```bash
    npm run dev
    ```

2.  The application will be running at `http://localhost:3000` (or whatever `PORT` you configured in `.env`).

## Usage

Navigate to `http://localhost:3000` in your web browser.

* **Homepage:** A brief overview of your progress and options.
    ![Screenshot of Homepage](https://via.placeholder.com/800x450?text=Algofy+Homepage+Screenshot)

* **Log Solved Questions:**
    Go to the "Log Question" section (or equivalent) to add details about a newly solved DSA problem.
    ![Screenshot of Log Question Page](https://via.placeholder.com/800x450?text=Log+Question+Form+Screenshot)

* **Set Goals:**
    Visit the "Goals" section to define your daily, weekly, or monthly targets.
    ![Screenshot of Set Goals Page](https://via.placeholder.com/800x450?text=Set+Goals+Form+Screenshot)

* **View Progress:**
    Check the dashboard or progress page to see how you're performing against your set goals.
    ![Screenshot of Progress Dashboard](https://via.placeholder.com/800x450?text=Progress+Dashboard+Screenshot)

## Project Structure
```
├── public/                 # Static assets (CSS, JS, images) for the frontend
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── views/                  # Server-side templates (e.g., .ejs, .pug files)
│   ├── index.ejs           # Example: Homepage template
│   └── partials/           # Example: Common reusable parts
├── app.js                  # Main Express.js application file (server entry point)
├── db.js                   # Database connection and query functions
├── package.json            # Project metadata and dependencies
├── package-lock.json       # npm dependency tree lock file
└── .env                    # Environment variables (local config, NOT committed to Git!)
└── README.md               # This file
```
## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please feel free to:

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information. *(Create a LICENSE file in your repo if you don't have one)*

## Contact

Your Name - [Your Email](mailto:your.email@example.com)
Project Link: [https://github.com/your-username/algofy](https://github.com/your-username/algofy)

## Acknowledgments

* [Express.js](https://expressjs.com/)
* [PostgreSQL](https://www.postgresql.org/)
* (Add any other significant libraries or resources you used)
