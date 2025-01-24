# Personal Budget API

## Description
This is an API for budget management using the envelope method. It allows you to create, update, delete and view budget envelopes.

## Installation
1. Clone the repository:
git clone https://github.com/your_username/Personal_Budget.git

2. Navigate to the project folder:
cd Personal_Budget

3. Establish dependencies:
npm install

4. Start the server:
node server.js

## Usage.
The API provides the following routes:

- `GET /envelopes` — get all envelopes
- `GET /envelopes/:id` — get a specific envelope by ID
- `POST /envelopes` — create a new envelope
- `PUT /envelopes/:id` — refresh the envelope
- `DELETE /envelopes/:id` — push the envelope

## Example request
Use Postman or any other API testing tool:
GET http://localhost:3000/envelopes


## License
MIT
