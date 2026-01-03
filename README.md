# 🚀 Dayflow HR

Welcome to **Dayflow**, a modern and intuitive HR management system built for the **Odoo x GCET Hackathon**. Dayflow simplifies core HR operations, providing a seamless experience for both employees and administrators, with a user interface inspired by Odoo's clean design.

---

## ✨ Features

*   **Employee Dashboard:** A personalized space for employees to manage their profile, view attendance, and track leave.
*   **Admin Dashboard:** A powerful overview for HR admins to monitor company-wide statistics, manage employees, and approve requests.
*   **Employee Management:** A complete roster of all employees, with detailed profile views and editing capabilities for admins.
*   **Attendance Tracking:** Simple check-in/check-out functionality for employees and a comprehensive daily and weekly attendance tracker for admins.
*   **Leave Management:** An easy-to-use system for employees to request time off and for admins to approve or reject requests.
*   **Payroll Management:** Admins can manage salary structures, and employees can view and download their monthly payslips.
*   **Role-Based Access Control:** A secure system that distinguishes between `Admin`, `HR`, and `Employee` roles, ensuring users only see what they need to.

---

## 🌐 Live Demo

You can access a live demonstration of the application hosted on Vercel.

**Link:** [https://dayflow-sable.vercel.app/](https://dayflow-sable.vercel.app/)

### Admin Access

To explore the administrator dashboard, please use the following credentials:

*   **Email:** `h.raulji2005@gmail.com`
*   **Password:** `harsh123`

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
*   **Authentication:** JWT (JSON Web Tokens)
*   **Hosting:** [Vercel](https://vercel.com/)

---

## 🏁 Getting Started

Follow these steps to get a local instance of Dayflow up and running.

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone <your-repository-url>
cd <repository-name>
```

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Set Up Environment Variables

You'll need a PostgreSQL database. You can get a free one from [Neon](https://neon.tech/).

Create a `.env.local` file in the root of your project and add the following variables:

```env
# Get this from your Neon project dashboard.
# Make sure to append "?sslmode=require" for Neon.
DATABASE_URL="postgres://user:password@host:port/dbname?sslmode=require"

# A long, random, and secret string for signing JWTs.
JWT_SECRET="your-super-secret-and-long-random-string"
```

### 4. Run the Development Server

Now, you can start the development server:

```bash
npm run dev
```

The application should now be running at [http://localhost:9002](http://localhost:9002).

---

## ☁️ Deploying to Vercel

You can deploy this application to Vercel in a few simple steps.

### 1. Push to GitHub

Make sure your project code is pushed to a GitHub repository.

### 2. Import Project on Vercel

*   Go to your [Vercel Dashboard](https://vercel.com/new).
*   Click **Import Git Repository** and select the repository you just pushed to.
*   Vercel will automatically detect that it's a Next.js project.

### 3. Configure Environment Variables

In the Vercel project settings, navigate to the "Environment Variables" section. You need to add the same variables from your `.env.local` file:

| Variable       | Description                                                                                             |
| :------------- | :------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Your PostgreSQL connection string from Neon.                                                            |
| `JWT_SECRET`   | The long, random, secret string you created for signing authentication tokens.                          |

### 4. Deploy

*   Click the **Deploy** button. Vercel will build and deploy your application.
*   Once deployed, you will get a public URL for your live application. Enjoy!
