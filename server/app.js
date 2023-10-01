const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); // Use mysql2 library
const bodyParser = require('body-parser');

const app = express();

app.use(cors());

// Create a MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123123',
  database: 'sakila',
});

app.use(express.json());

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

app.get('/movies', (req, res) => {
  const q = `
    SELECT film.film_id, film.title, film.description, category.name AS genre
    FROM film
    INNER JOIN film_category ON film.film_id = film_category.film_id
    INNER JOIN category ON film_category.category_id = category.category_id
    LIMIT 5;
  `;

  console.log('Query movies is displayed');

  db.query(q, (err, data) => {
    if (err) {
      console.error('Error querying the database: ' + err.stack);
      return res.status(500).json({ error: 'Database error' });
    }

    // Send the data to the frontend as an array of objects
    res.json(data);
  });
});

// Define the endpoint to fetch top actors
app.get('/actors', (req, res) => {
  const q = `
    SELECT actor.actor_id, actor.first_name, actor.last_name, COUNT(film_actor.film_id) AS movie_count
    FROM actor
    INNER JOIN film_actor ON actor.actor_id = film_actor.actor_id
    GROUP BY actor.actor_id
    ORDER BY movie_count DESC
    LIMIT 5;
  `;

  db.query(q, (err, data) => {
    if (err) {
      console.error('Error querying the database: ' + err.stack);
      return res.status(500).json({ error: 'Database error' });
    }

    // Send the data to the frontend as an array of objects
    res.json(data);
  });
});

// Add more routes for customers, searching movies, etc. as needed

// Parse JSON requests
app.use(bodyParser.json());

// Function to get the next customer ID
const getNextCustomerId = (callback) => {
  // Execute a SQL query to get the highest customer ID from the database
  const query = 'SELECT MAX(customer_id) AS max_customer_id FROM customer';
  // Execute the query and handle the result
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error getting the max customer ID:', err);
      return callback(err, null);
    }
    // Calculate the next customer ID
    const maxCustomerId = result[0].max_customer_id || 0;
    const newCustomerId = maxCustomerId + 1;
    callback(null, newCustomerId);
  });
};
app.get('/movies/:movieId', (req, res) => {
  const movieId = req.params.movieId;
  const q = `
    SELECT film.film_id, film.title, film.description, category.name AS genre
    FROM film
    INNER JOIN film_category ON film.film_id = film_category.film_id
    INNER JOIN category ON film_category.category_id = category.category_id
    WHERE film.film_id = ?;
  `;

  db.query(q, [movieId], (err, data) => {
    if (err) {
      console.error('Error querying the database: ' + err.stack);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.length === 0) {
      // Handle the case where the movie with the specified movieId is not found
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Send the movie details to the frontend
    res.json(data[0]);
  });
});


module.exports = app;
