# Personal Budget 2

## Description
**Personal Budget 2** is an API that allows users to manage their budgets using the envelope method. This project includes CRUD operations for envelopes and transactions, integrates a PostgreSQL database, and is deployed on [Render](https://render.com). The API supports creating, reading, updating, and deleting envelopes, as well as managing transactions that affect their budgets.

---

## Features
- **Envelope Management**: Create, update, delete, and view budget envelopes.
- **Transaction Handling**: Add, delete, and retrieve transactions tied to specific envelopes.
- **Persistent Storage**: PostgreSQL database hosted on Render.
- **API Documentation**: Automatically generated API documentation using Swagger.

---

## Deployment
The application is deployed and available at:
- **API Base URL**: [Go to the site](https://personal-budget-2-8k83.onrender.com/)
- **API Documentation**: [Go to API docs](https://personal-budget-2-8k83.onrender.com/api-docs/)  
*Due to the fact that the project is deployed on a free server, it is not always available, the free plan uses the auto-sleep function. Try refreshing the page after 15-30 seconds.*

---

## Technologies Used
- **Node.js** (Backend server with Express)
- **PostgreSQL** (Database for persistent data storage)
- **Sequelize** (ORM for database operations)
- **Render** (Hosting for the application and database)
- **Swagger** (API documentation)

---

## Setup and Installation

### Prerequisites
- Node.js and npm installed on your local machine.
- PostgreSQL installed locally if testing with a local database.

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/personal_budget_2.git
   
2. **Navigate to the project folder:**
   ```bash
   cd personal_budget_2

3. **Install dependencies:**
   ```bash
   npm install

4. **Set up your `.env` file: Add your database connection string and other environment variables:**
   ```bash
   DATABASE_URL=your_database_url

5. **Run the application:**
   ```bash
   node server.js

6. **Access the application locally:**  
   API: [http://localhost:3000](http://localhost:3000)  
   Swagger Docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Usage
The API provides the following routes:

Envelopes:
- `GET /envelopes` — Get all envelopes.
- `GET /envelopes/:id` — Retrieve a specific envelope by ID.
- `POST /envelopes` — Create a new envelope.
- `PUT /envelopes/:id` — Update an envelope's name or budget.
- `DELETE /envelopes/:id` — Delete an envelope by ID.

Transactions:
- `GET /transactions` — Retrieve all transactions.
- `POST /transactions` — Create a new transaction.
- `GET /transactions/:ids` — Retrieve a specific transaction by ID.
- `DELETE /transactions/:id` — Delete a transaction by ID.

## Example request
Use Postman or any other API testing tool.  
Example to get all envelopes:  
GET http://localhost:3000/envelopes

## License
MIT



