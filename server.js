require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Connect CORS
const app = express();
const port = 3000; 
const db = require('./db');

// Use CORS for all routes
app.use(cors());

// Array for storing all envelopes
let envelopes = [];
let nextId = 1; // Initial ID for envelopes

// Middleware for processing JSON requests
app.use(express.json());

// POST endpoint to create a new envelope
app.post('/envelopes', async (req, res) => {
  const { title, budget } = req.body;

  if (!title || budget === undefined) {
    return res.status(400).send('Title and budget are mandatory.');
  }

  try {
    const result = await db.query(
      'INSERT INTO envelopes (title, budget) VALUES ($1, $2) RETURNING *',
      [title, budget]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating envelope.');
  }
});

// GET endpoint to retrieve all envelopes
app.get('/envelopes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM envelopes');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving envelopes.');
  }
});


// GET endpoint to retrieve envelope by ID 
app.get('/envelopes/:id', (req, res) => {
    const envelopeId = parseInt(req.params.id); // Parsing ID from URL parameter
    const envelope = envelopes.find(env => env.id === envelopeId);

    // If no envelope is found, return 404
    if (!envelope) {
        return res.status(404).send(`Envelope ID ${envelopeId} not found.`);
    }

    // Returning the envelope we found
    res.status(200).json(envelope);
});

// PUT endpoint to update the envelope
app.put('/envelopes/:id', (req, res) => {
    const envelopeId = parseInt(req.params.id);
    const { budget, title } = req.body;

    const envelope = envelopes.find(env => env.id === envelopeId);

    if (!envelope) {
        return res.status(404).send(`Envelope ID ${envelopeId} not found.`);
    }

    // Data validation
    if (budget !== undefined) {
        if (typeof budget !== 'number' || budget < 0) {
            return res.status(400).send('The budget should be a positive number.');
        }
        envelope.budget = budget; // Budget Update
    }

    if (title) {
        envelope.title = title; // Updating the envelope name
    }

    res.status(200).send(`Envelope ID ${envelopeId} updated: ${JSON.stringify(envelope)}`);
});

// POST endpoint to subtract the amount from the envelope budget
app.post('/envelopes/:id/withdraw', (req, res) => {
    const envelopeId = parseInt(req.params.id);
    const { amount } = req.body;

    const envelope = envelopes.find(env => env.id === envelopeId);

    if (!envelope) {
        return res.status(404).send(`Envelope ID ${envelopeId} not found.`);
    }

    // Data validation
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).send('The sum for subtraction must be a positive number.');
    }

    // Checking whether the budget is sufficient for subtraction
    if (envelope.budget < amount) {
        return res.status(400).send('Insufficient funds on the envelope.');
    }

    envelope.budget -= amount; // Deducting an amount from the budget

    res.status(200).send(`The amount ${amount} has been successfully deducted from the envelope '${envelope.title}'. Current budget: ${envelope.budget}.`);
});

// DELETE endpoint for deleting an envelope by ID
app.delete('/envelopes/:id', (req, res) => {
    const envelopeId = parseInt(req.params.id);
    const originalLength = envelopes.length;

    // Filter the array to remove the envelope with the specified ID
    envelopes = envelopes.filter(env => env.id !== envelopeId);

    // If the length of the array has changed, then the envelope has been found and removed
    if (envelopes.length < originalLength) {
        res.status(200).send(`Envelope ID ${envelopeId} successfully deleted.`);
    } else {
        res.status(404).send(`Envelope ID ${envelopeId} not found.`);
    }
});

// POST endpoint for budget transfer between envelopes
app.post('/envelopes/transfer/:from/:to', (req, res) => {
    const fromId = parseInt(req.params.from); // ID of the envelope from which we are transferring
    const toId = parseInt(req.params.to);     // ID of the envelope we're transferring
    const { amount } = req.body;               // Transfer amount from the request body

    // Finding both envelopes
    const fromEnvelope = envelopes.find(env => env.id === fromId);
    const toEnvelope = envelopes.find(env => env.id === toId);

    // Checking to see if both envelopes are found
    if (!fromEnvelope) {
        return res.status(404).send(`Envelope ID ${fromId} not found.`);
    }
    if (!toEnvelope) {
        return res.status(404).send(`Envelope ID ${toId} not found.`);
    }

    // Amount validation
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).send('The amount to be transferred must be a positive number.');
    }
    if (fromEnvelope.budget < amount) {
        return res.status(400).send('Insufficient funds on the envelope for the transfer.');
    }

    // Transferring funds
    fromEnvelope.budget -= amount; // Subtract the amount from the first envelope
    toEnvelope.budget += amount;    // Add the amount to the second envelope

    res.status(200).send(`The amount ${amount}  was successfully transferred from the envelope '${fromEnvelope.title}' to the envelope '${toEnvelope.title}'.`);
});

// Server startup
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
