const express = require('express')
const cors = require('cors');
const mysql = require('mysql')
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
  
  app.use(express.json())

  
  // Connect to the database
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to the database');
  });

  app.get('/movies', (req, res) => {
    const q = 
    `SELECT film.film_id, film.title, film.description, category.name AS genre
    FROM film
    INNER JOIN film_category ON film.film_id = film_category.film_id
    INNER JOIN category ON film_category.category_id = category.category_id
    LIMIT 5;
    `;
    console.log(`Query movies is displayed`);
  
    db.query(q, (err, data) => {
      if (err) {
        console.error('Error querying the database: ' + error.stack);
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

  app.get('/actors/:actorId', (req, res) => {
    const actorId = req.params.actorId;
  
    // Query to get actor details
    const actorQuery = `SELECT * FROM actor WHERE actor_id = ?`;
  
    // Query to get top rented movies for the actor
    const topMoviesQuery = `
      SELECT film.title, COUNT(rental.rental_id) AS rentalCount
      FROM actor
      INNER JOIN film_actor ON actor.actor_id = film_actor.actor_id
      INNER JOIN inventory ON film_actor.film_id = inventory.film_id
      INNER JOIN rental ON inventory.inventory_id = rental.inventory_id
      INNER JOIN film ON inventory.film_id = film.film_id
      WHERE actor.actor_id = ?
      GROUP BY film.title
      ORDER BY rentalCount DESC
      LIMIT 5
    `;
  
    // Execute both queries in parallel
    db.query(actorQuery, [actorId], (actorErr, actorData) => {
      if (actorErr) {
        console.error('Error querying actor details: ' + actorErr.stack);
        return res.status(500).json({ error: 'Database error' });
      }
  
      db.query(topMoviesQuery, [actorId], (moviesErr, moviesData) => {
        if (moviesErr) {
          console.error('Error querying top rented movies: ' + moviesErr.stack);
          return res.status(500).json({ error: 'Database error' });
        }
  
        const actorDetails = actorData[0];
        const topRentedMovies = moviesData;
  
        // Combine actor details and top rented movies data
        const actorResponse = {
          actor: actorDetails,
          topRentedMovies: topRentedMovies,
        };
  
        res.json(actorResponse);
      });
    });
  });

  app.get('/movies_all', (req, res) => {
    const searchTerm = req.query.searchTerm || '';
  
    // Implement a database query to search for movies by title, actor, or genre
    const query = `
      SELECT 
        film.film_id, 
        film.title, 
        film.description, 
        category.name AS genre,
        GROUP_CONCAT(CONCAT(actor.first_name, ' ', actor.last_name) SEPARATOR ', ') AS actors
      FROM film
      INNER JOIN film_category ON film.film_id = film_category.film_id
      INNER JOIN category ON film_category.category_id = category.category_id
      INNER JOIN film_actor ON film.film_id = film_actor.film_id
      INNER JOIN actor ON film_actor.actor_id = actor.actor_id
      WHERE
        film.title LIKE ? OR
        actor.first_name LIKE ? OR
        actor.last_name LIKE ? OR
        category.name LIKE ?
      GROUP BY film.film_id, film.title, film.description, category.name;
    `;
  
    const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
  
    db.query(query, params, (error, results) => {
      if (error) {
        console.error('Error fetching movies:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      return res.json(results);
    });
  });
  
  app.get('/movies/:movieId', (req, res) => {
    const movieId = req.params.movieId;
    const q = `
    SELECT 
    film.film_id, 
    film.title, 
    film.description, 
    category.name AS genre,
    GROUP_CONCAT(CONCAT(actor.first_name, ' ', actor.last_name) SEPARATOR ', ') AS actors
FROM film
INNER JOIN film_category ON film.film_id = film_category.film_id
INNER JOIN category ON film_category.category_id = category.category_id
INNER JOIN film_actor ON film.film_id = film_actor.film_id
INNER JOIN actor ON film_actor.actor_id = actor.actor_id
WHERE film.film_id = ?
GROUP BY film.film_id, film.title, film.description, category.name; -- Include category.name in GROUP BY

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
  
  
  app.get('/customers/:customerId/rented-movies', (req, res) => {
    const customerId = req.params.customerId;
  
    // SQL query to retrieve rented movies for the customer
    const query = `
      SELECT film.title
      FROM rental
      INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
      INNER JOIN film ON inventory.film_id = film.film_id
      WHERE rental.customer_id = ?
    `;
  
    // Execute the query with the customer ID as a parameter
    db.query(query, [customerId], (err, results) => {
      if (err) {
        console.error('Error fetching rented movies:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the list of rented movies as JSON
      res.json(results);
    });
  });
  app.get('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    const q = `SELECT * FROM customer WHERE customer_id = ${customerId}`;
  
    db.query(q, (err, data) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (data.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
  
      // Send the customer details to the frontend
      res.json(data[0]);
    });
  });
  
  // API endpoint to fetch customers
app.get('/customers', (req, res) => {
    // SQL query to fetch customers
    let query = 'SELECT customer_id, first_name, last_name FROM customer';
  
    // Execute the query
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query: ' + err.stack);
        return res.status(500).json({ error: 'Database error' });
      }
  
      res.json(results);
    });
  });
  
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
  
  // Create a new customer
  app.post('/add-customer', (req, res) => {
    // Get the next customer ID
    getNextCustomerId((err, newCustomerId) => {
      if (err) {
        console.error('Error getting the next customer ID:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      // Create the new customer data including the generated customer ID
      const newCustomer = {
        customer_id: newCustomerId,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        address_id: req.body.address_id,
        // You may need to include other customer data here
      };
  
      // Insert the new customer into the database
      const insertQuery = 'INSERT INTO customer SET ?';
      db.query(insertQuery, newCustomer, (err, data) => {
        if (err) {
          console.error('Error inserting customer: ' + err.stack);
          return res.status(500).json({ error: 'Database error' });
        }
  
        return res.json('New Customer is added successfully.');
      });
    });
  });
  
  
  // Start the server
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });