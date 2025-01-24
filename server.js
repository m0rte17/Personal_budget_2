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
app.get('/envelopes/:id', async (req, res) => {
    const envelopeId = parseInt(req.params.id); // Parsing ID from URL parameter
    
    try {
        // SQL query for searching envelope by ID
        const result = await db.query('SELECT * FROM envelopes WHERE id = $1', [envelopeId]);

        // Check if the envelope exist
        if (result.rows.length === 0) {
            return res.status(400).send('Envelope ID ${envelopeId} not found.');
        }

        // Return found envelope
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error retrieving envelope:', err);
        res.status(500).send('An error occurred while retrieving the envelope.');
    }
});

// PUT endpoint to update the envelope
app.put('/envelopes/:id', async (req, res) => {
    const envelopeId = parseInt(req.params.id);
    const { budget, title } = req.body;

    try {
        // Check envelope exist
        const checkResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [envelopeId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).send(`Envelope ID ${envelopeId} not found.`);

        }

        // Data validation
        if (budget !== undefined) {
            if (typeof budget !== 'number' || budget < 0) {
                return res.status(400).send('The budget should be a positive number.');
            }
        }

        // Updating data in the database
        const updateQuery = `
            UPDATE envelopes
            SET title = COALESCE($1, title), budget = COALESCE($2, budget)
            WHERE id = $3
            RETURNING *;
        `;
        const updateResult = await db.query(updateQuery, [title, budget, envelopeId]);

         // Return updated envelope
         res.status(200).json(updateResult.rows[0]);
        } catch (err) {
            console.error('Error updating envelope:', err);
            res.status(500).send('An error occurred while updating the envelope.');
        }
    
});

// POST endpoint to subtract the amount from the envelope budget
app.post('/envelopes/:id/withdraw', async (req, res) => {
    const envelopeId = parseInt(req.params.id);
    const { amount } = req.body;

    try {
        // Check envelope exist
        const result = await db.query('SELECT * FROM envelopes WHERE id = $1', [envelopeId]);

        if (result.rows.length === 0) {
            return res.status(404).send(`Envelope ID ${envelopeId} not found.`);
        }

        const envelope = result.rows[0];

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).send('The sum for subtraction must be a positive number.');
        }

        if (envelope.budget < amount) {
            return res.status(400).send('Insufficient funds on the envelope.');
        }

        // Update budget in db 
        const newBudget = envelope.budget - amount;
        const updateResult = await db.query(
            'UPDATE envelopes SET budget = $1 WHERE id = $2 RETURNING *',
            [newBudget, envelopeId]
        );

        res.status(200).send(
            `The amount ${amount} has been successfully deducted from the envelope '${envelope.title}'. Current budget: ${updateResult.rows[0].budget}.`
        );
    } catch (err) {
        console.error('Error processing withdrawal:', err);
        res.status(500).send('An error occurred while processing the withdrawal.');
    }
});

// DELETE endpoint for deleting an envelope by ID
app.delete('/envelopes/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
        const result = await db.query('DELETE FROM envelopes WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).send(`Envelope ID ${id} not found.`);
        }

        res.status(200).send(`Envelope ID ${id} successfully deleted.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting envelope.');
    }
});

// POST endpoint for budget transfer between envelopes
app.post('/envelopes/transfer/:from/:to', async (req, res) => {
    const fromId = parseInt(req.params.from); // ID of the envelope from which we are transferring
    const toId = parseInt(req.params.to);     // ID of the envelope we're transferring
    const { amount } = req.body;               // Transfer amount from the request body

    try {
        const fromEnvelopeResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [fromId]);
        const toEnvelopeResult = await db.query('SELECT * FROM envelopes WHERE id = $1', [toId]);
        
        if (fromEnvelopeResult.rows.length === 0) {
            return res.status(404).send(`Envelope ID ${fromId} not found.`);
        }
        if (toEnvelopeResult.rows.length === 0) {
            return res.status(404).send(`Envelope ID ${toId} not found.`);
        }

        const fromEnvelope = fromEnvelopeResult.rows[0];
        const toEnvelope = toEnvelopeResult.rows[0];

        // Checking the validity of the sum
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).send('The amount to be transferred must be a positive number.');
        }

        // Check if there are enough funds on the “from” envelope
        if (fromEnvelope.budget < amount) {
            return res.status(400).send('Insufficient funds on the envelope for the transfer.');
        }

        // Execute the transfer within the transaction
        await db.query('BEGIN');

        // Write off the amount from the “from” envelope
        await db.query('UPDATE envelopes SET budget = budget - $1 WHERE id = $2', [amount, fromId]);

        // Add the amount to the “to” envelope
        await db.query('UPDATE envelopes SET budget = budget + $1 WHERE id = $2', [amount, toId]);

        await db.query('COMMIT');

        res.status(200).send(
            `The amount ${amount} was successfully transferred from the envelope '${fromEnvelope.title}' to the envelope '${toEnvelope.title}'.`
        );
    } catch (err) {
        await db.query('ROLLBACK'); // Cancel transaction in case of error
        console.error('Error transferring funds:', err);
        res.status(500).send('An error occurred while transferring funds.');
    }
});

// Endpoint to add a new transaction
app.post('/transactions', async (req, res) => {
    const { envelopeId, amount, recipient } = req.body;

    try {
        // Checking the existence of the envelope
        const envelopeCheck = await db.query('SELECT * FROM envelopes WHERE id = $1', [envelopeId]);
        if (envelopeCheck.rows.length === 0) {
            return res.status(404).send(`Envelope ID ${envelopeId} not found.`);
        }

        const envelope = envelopeCheck.rows[0];

        // Budget check on an expense transaction
        if (amount < 0 && envelope.budget + amount < 0) {
            return res.status(400).send('Insufficient funds in the envelope.');
        }

        // Add transaction to the table 
        const result = await db.query(
            `INSERT INTO transactions (amount, recipient, envelope_id) VALUES ($1, $2, $3) RETURNING *`,
            [amount, recipient, envelopeId]
        );

        // Update envelope budget
        await db.query('UPDATE envelopes SET budget = budget + $1 WHERE id = $2', [amount, envelopeId]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating transaction:', err);
        res.status(500).send('An error occurred while creating the transaction.');
    }
});

// Endpoint to get a list of all transactions
app.get('/transactions', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM transactions');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error retrieving transactions:', err);
        res.status(500).send('An error occurred while retrieving transactions.');
    }
});

// Endpoint to retrieve transactions by envelope_id
app.get('/envelopes/:id/transactions', async (req, res) => {
    const envelopeId = parseInt(req.params.id);

    try {
        const result = await db.query('SELECT * FROM transactions WHERE envelope_id = $1', [envelopeId]);

        if (result.rows.length === 0) {
            return res.status(404).send(`No transactions found for envelope ID ${envelopeId}.`);
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error retrieving transactions:', err);
        res.status(500).send('An error occurred while retrieving transactions.');
    }
});

// Server startup
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
