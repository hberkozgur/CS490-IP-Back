const express = require('express')
const cors = require('cors');
const mysql = require('mysql')
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const fs = require('fs');
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





app.get('/generate-pdf-report', async (req, res) => {
  try {
    // Fetch customer data from your /customers endpoint
    const response = await axios.get('http://localhost:4000/customers');
    const customers = response.data;

    const doc = new PDFDocument();

    // Pipe the PDF to the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=customer_report.pdf');
    doc.pipe(res);

    // Add content to the PDF (e.g., list of customers who rented movies)
    doc.fontSize(12).text('Customer Report', { align: 'center' });

    // Add customer data to the PDF
    doc.moveDown(); // Move down a line
    doc.text('List of Customers:', { underline: true });

    customers.forEach((customer, index) => {
      doc.text(`${index + 1}. ${customer.first_name} ${customer.last_name} (${customer.email})`);
    });

    // End the document
    doc.end();
  } catch (error) {
    console.error('Error fetching customer data:', error);
    res.status(500).json({ error: 'Error fetching customer data' });
  }
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
      SELECT film.film_id, film.title
      FROM rental
      INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
      INNER JOIN film ON inventory.film_id = film.film_id
      WHERE rental.customer_id = ?;
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
  // Add a new route for deleting a customer
  app.delete('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;
  
    // First, delete related records in the payment table
    const deletePaymentsQuery = `DELETE FROM payment WHERE customer_id = ?`;
    db.query(deletePaymentsQuery, [customerId], (paymentErr, paymentData) => {
      if (paymentErr) {
        console.error('Error deleting payments for the customer: ' + paymentErr.stack);
        return res.status(500).json({ error: 'Database error' });
      }
  
      // Now, delete the customer
      const deleteCustomerQuery = `DELETE FROM customer WHERE customer_id = ?`;
      db.query(deleteCustomerQuery, [customerId], (customerErr, customerData) => {
        if (customerErr) {
          console.error('Error deleting customer from the database: ' + customerErr.stack);
          return res.status(500).json({ error: 'Database error' });
        }
  
        if (customerData.affectedRows === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
  
        // Customer and related payment records deleted successfully
        res.json({ message: 'Customer and related payment records deleted successfully' });
      });
    });
  });
  
// Add a new route for returning a rented movie
app.put('/customers/:customerId/return-movie/:movieId', (req, res) => {
  const customerId = req.params.customerId;
  const movieId = req.params.movieId;

  // Start a transaction to ensure atomicity
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting a database transaction: ' + err.stack);
      return res.status(500).json({ error: 'Database error' });
    }

    // First, check if the rental record exists and is still rented (return_date is NULL)
    const checkRentalQuery = `
    SELECT rental.rental_id
    FROM rental
    INNER JOIN inventory ON rental.inventory_id = inventory.inventory_id
    WHERE rental.customer_id = ${customerId}
      AND inventory.film_id = ${movieId}
      AND rental.return_date IS NULL;
    `;

    db.query(checkRentalQuery, [customerId, movieId], (rentalErr, rentalData) => {
      if (rentalErr) {
        console.error('Error checking rental record: ' + rentalErr.stack);
        db.rollback(() => {
          console.error('Transaction rolled back due to an error.');
          return res.status(500).json({ error: 'Database error' });
        });
      }

      if (rentalData.length === 0) {
        // No valid rental record found
        db.rollback(() => {
          console.error('No valid rental record found.');
          return res.status(404).json({ error: 'No valid rental record found' });
        });
      } else {
        // Valid rental record found, proceed to update the return_date
        const updateRentalQuery = `
          UPDATE rental
          SET return_date = NOW()
          WHERE customer_id = ? 
            AND inventory_id IN (SELECT inventory_id FROM inventory WHERE film_id = ?)
            AND return_date IS NULL
        `;

        db.query(updateRentalQuery, [customerId, movieId], (updateErr, updateData) => {
          if (updateErr) {
            console.error('Error updating rental record: ' + updateErr.stack);
            db.rollback(() => {
              console.error('Transaction rolled back due to an error.');
              return res.status(500).json({ error: 'Database error' });
            });
          }

          // Commit the transaction if everything is successful
          db.commit((commitErr) => {
            if (commitErr) {
              console.error('Error committing the transaction: ' + commitErr.stack);
              db.rollback(() => {
                console.error('Transaction rolled back due to an error.');
                return res.status(500).json({ error: 'Database error' });
              });
            }

            // Rental record updated successfully
            res.json({ message: 'Rental record updated successfully' });
          });
        });
      }
    });
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
        store_id: '1',
        customer_id: newCustomerId,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        address_id: '1'
      };
  
      // Insert the new customer into the database
      const insertQuery = 'INSERT INTO customer SET ?';
      db.query(insertQuery, newCustomer, (err, data) => {
        if (err) {
          console.error('Error inserting customer: ' + err.stack);
          return res.status(500).json({ error: 'Database error' });
        }
  
        // Send the customer ID in the response
        return res.json({ customerId: newCustomerId });
      });
    });
  });
  
  // In your Express server code, add the following route for customer editing:

  app.put('/customers/:customerId/edit', (req, res) => {
    const customerId = req.params.customerId;
    const { first_name, last_name, email } = req.body; // Extract data from the request body
  
    // Update the customer information in the database
    const updateQuery = 'UPDATE customer SET first_name = ?, last_name = ?, email = ? WHERE customer_id = ?';
    db.query(updateQuery, [first_name, last_name, email, customerId], (err, result) => {
      if (err) {
        console.error('Error updating customer information:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      // Return success response
      return res.json({ success: true, message: 'Customer information updated successfully' });
    });
  });
  

  
  // Start the server
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });