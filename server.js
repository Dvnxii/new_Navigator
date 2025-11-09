// server.js - Main Backend Server
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_campus_navigator',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

//  AUTH ROUTES 

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, full_name, email, user_type } = req.body;

        // Validation
        if (!username || !password || !email || !full_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if username exists
        const [existingUsers] = await pool.query(
            'SELECT user_id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email exists
        const [existingEmails] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingEmails.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (username, password, full_name, email, user_type) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, full_name, email, user_type || 'student']
        );

        res.status(201).json({
            message: 'Registration successful',
            user_id: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = ?',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                username: user.username, 
                user_type: user.user_type 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                user_id: user.user_id,
                username: user.username,
                name: user.full_name,
                email: user.email,
                user_type: user.user_type
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { username, email, new_password } = req.body;

        if (!username || !email || !new_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Find user by username and email
        const [users] = await pool.query(
            'SELECT user_id, user_type FROM users WHERE username = ? AND email = ?',
            [username, email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found with provided credentials' });
        }

        const user = users[0];

        // Don't allow admin password reset
        if (user.user_type === 'admin') {
            return res.status(403).json({ error: 'Cannot reset admin password' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password
        await pool.query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPassword, user.user_id]
        );

        res.json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

//  LOCATION ROUTES 

// Get all locations
app.get('/api/locations', async (req, res) => {
    try {
        const [locations] = await pool.query(
            'SELECT * FROM locations ORDER BY location_id'
        );
        res.json(locations);
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

// Get location by ID
app.get('/api/locations/:id', async (req, res) => {
    try {
        const [locations] = await pool.query(
            'SELECT * FROM locations WHERE location_id = ?',
            [req.params.id]
        );

        if (locations.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        res.json(locations[0]);
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ error: 'Failed to fetch location' });
    }
});

//  PATH ROUTES 

// Get all paths
app.get('/api/paths', async (req, res) => {
    try {
        const [paths] = await pool.query(`
            SELECT 
                p.*,
                l1.location_name as from_location_name,
                l2.location_name as to_location_name
            FROM paths p
            JOIN locations l1 ON p.from_location_id = l1.location_id
            JOIN locations l2 ON p.to_location_id = l2.location_id
            ORDER BY p.from_location_id, p.to_location_id
        `);
        res.json(paths);
    } catch (error) {
        console.error('Get paths error:', error);
        res.status(500).json({ error: 'Failed to fetch paths' });
    }
});

// Get paths between two locations
app.get('/api/paths/:from/:to', async (req, res) => {
    try {
        const [paths] = await pool.query(
            'SELECT * FROM paths WHERE from_location_id = ? AND to_location_id = ?',
            [req.params.from, req.params.to]
        );

        if (paths.length === 0) {
            return res.status(404).json({ error: 'No path found' });
        }

        res.json(paths[0]);
    } catch (error) {
        console.error('Get path error:', error);
        res.status(500).json({ error: 'Failed to fetch path' });
    }
});

//  NAVIGATION HISTORY ROUTES 

// Save navigation history
app.post('/api/navigation/history', authenticateToken, async (req, res) => {
    try {
        const { from_location_id, to_location_id, distance_traveled, time_taken, completed } = req.body;

        const [result] = await pool.query(
            'INSERT INTO navigation_history (user_id, from_location_id, to_location_id, distance_traveled, time_taken, completed) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.user_id, from_location_id, to_location_id, distance_traveled, time_taken, completed]
        );

        res.status(201).json({
            message: 'Navigation history saved',
            history_id: result.insertId
        });

    } catch (error) {
        console.error('Save history error:', error);
        res.status(500).json({ error: 'Failed to save navigation history' });
    }
});

// Get user's navigation history
app.get('/api/navigation/history', authenticateToken, async (req, res) => {
    try {
        const [history] = await pool.query(`
            SELECT 
                nh.*,
                l1.location_name as from_location_name,
                l2.location_name as to_location_name
            FROM navigation_history nh
            JOIN locations l1 ON nh.from_location_id = l1.location_id
            JOIN locations l2 ON nh.to_location_id = l2.location_id
            WHERE nh.user_id = ?
            ORDER BY nh.navigation_date DESC
            LIMIT 50
        `, [req.user.user_id]);

        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to fetch navigation history' });
    }
});

//  CAMPUS IMAGES ROUTES 

// Get images for a location
app.get('/api/images/location/:location_id', async (req, res) => {
    try {
        const [images] = await pool.query(
            'SELECT * FROM campus_images WHERE location_id = ? ORDER BY is_primary DESC, uploaded_at DESC',
            [req.params.location_id]
        );
        res.json(images);
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Add new image (admin only)
app.post('/api/images', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { location_id, image_url, image_title, caption, image_type, is_primary } = req.body;

        const [result] = await pool.query(
            'INSERT INTO campus_images (location_id, image_url, image_title, caption, image_type, uploaded_by, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [location_id, image_url, image_title, caption, image_type, req.user.user_id, is_primary || 0]
        );

        res.status(201).json({
            message: 'Image added successfully',
            image_id: result.insertId
        });

    } catch (error) {
        console.error('Add image error:', error);
        res.status(500).json({ error: 'Failed to add image' });
    }
});

//  FACILITIES ROUTES 

// Get facilities for a location
app.get('/api/facilities/location/:location_id', async (req, res) => {
    try {
        const [facilities] = await pool.query(
            'SELECT * FROM facilities WHERE location_id = ? AND is_available = 1',
            [req.params.location_id]
        );
        res.json(facilities);
    } catch (error) {
        console.error('Get facilities error:', error);
        res.status(500).json({ error: 'Failed to fetch facilities' });
    }
});

//  LOCATION ITEMS (CLASSES/LABS) ROUTES 

// Get all items for a location
app.get('/api/location-items/:location_id', async (req, res) => {
    try {
        const [items] = await pool.query(
            'SELECT * FROM location_items WHERE location_id = ? ORDER BY created_at DESC',
            [req.params.location_id]
        );
        res.json(items);
    } catch (error) {
        console.error('Get location items error:', error);
        res.status(500).json({ error: 'Failed to fetch location items' });
    }
});

// Add item to location (admin only)
app.post('/api/location-items', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { location_id, item_name, floor, capacity, description } = req.body;

        const [result] = await pool.query(
            'INSERT INTO location_items (location_id, item_name, floor, capacity, description) VALUES (?, ?, ?, ?, ?)',
            [location_id, item_name, floor, capacity, description]
        );

        res.status(201).json({
            message: 'Item added successfully',
            item_id: result.insertId
        });

    } catch (error) {
        console.error('Add location item error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update location item (admin only)
app.put('/api/location-items/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { item_name, floor, capacity, description } = req.body;

        await pool.query(
            'UPDATE location_items SET item_name = ?, floor = ?, capacity = ?, description = ? WHERE item_id = ?',
            [item_name, floor, capacity, description, req.params.id]
        );

        res.json({ message: 'Item updated successfully' });

    } catch (error) {
        console.error('Update location item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete location item (admin only)
app.delete('/api/location-items/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await pool.query(
            'DELETE FROM location_items WHERE item_id = ?',
            [req.params.id]
        );

        res.json({ message: 'Item deleted successfully' });

    } catch (error) {
        console.error('Delete location item error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

//  ANALYTICS ROUTES 

// Get user statistics (admin only)
app.get('/api/analytics/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN user_type = 'student' THEN 1 ELSE 0 END) as students,
                SUM(CASE WHEN user_type = 'faculty' THEN 1 ELSE 0 END) as faculty,
                SUM(CASE WHEN user_type = 'visitor' THEN 1 ELSE 0 END) as visitors,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM users
        `);

        res.json(stats[0]);

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
});

// Get popular routes
app.get('/api/analytics/popular-routes', authenticateToken, async (req, res) => {
    try {
        const [routes] = await pool.query(`
            SELECT 
                l1.location_name as from_location,
                l2.location_name as to_location,
                COUNT(*) as usage_count,
                AVG(distance_traveled) as avg_distance
            FROM navigation_history nh
            JOIN locations l1 ON nh.from_location_id = l1.location_id
            JOIN locations l2 ON nh.to_location_id = l2.location_id
            WHERE nh.completed = 1
            GROUP BY nh.from_location_id, nh.to_location_id
            ORDER BY usage_count DESC
            LIMIT 10
        `);

        res.json(routes);

    } catch (error) {
        console.error('Get popular routes error:', error);
        res.status(500).json({ error: 'Failed to fetch popular routes' });
    }
});

//  ERROR HANDLING 

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

//  START SERVER 

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});

module.exports = app;
