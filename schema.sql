-- SMART CAMPUS NAVIGATOR DATABASE SCHEMA
-- Database Management System: MySQL/MariaDB
-- Version: 2.0 with Enhanced Features

-- Create Database
CREATE DATABASE IF NOT EXISTS smart_campus_navigator;
USE smart_campus_navigator;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS location_items;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS campus_images;
DROP TABLE IF EXISTS navigation_history;
DROP TABLE IF EXISTS paths;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;

--  USERS TABLE 
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    user_type ENUM('student', 'faculty', 'admin', 'visitor') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - hashed with bcrypt)
-- Note: In production, hash this password using bcrypt with salt rounds 10
INSERT INTO users (username, password, full_name, email, user_type) VALUES
('admin', '$2a$10$rBV2HDeWwmkUy3.9OWrz0OqP7W5p5tJZ1xCnYdWYoqKJz8H8cXZzO', 'System Administrator', 'admin@campus.edu', 'admin');

--  LOCATIONS TABLE 
CREATE TABLE locations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50),
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    floor_number INT,
    building_code VARCHAR(10),
    is_accessible BOOLEAN DEFAULT TRUE,
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location_type (location_type),
    INDEX idx_building_code (building_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample locations
INSERT INTO locations (location_id, location_name, location_type, description, building_code, latitude, longitude, image_path) VALUES
(1, 'Main Gate', 'gate', 'Main entrance to the campus with security checkpoint', 'MG', 29.375481, 79.530486, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFmmWRQGshSRuZWyZNVipAxCtRrrBpPnO7LA&s'),
(2, 'Library', 'building', 'Three-story library with extensive book collection and study areas', 'LIB', 29.375620, 79.530850, 'https://images.shiksha.com/mediadata/images/1689075683phpwmRg1B.jpeg'),
(3, 'Mess Area', 'facility', 'Large cafeteria serving breakfast, lunch, and dinner', 'MESS', 29.375350, 79.530920, NULL),
(4, 'Computer Lab', 'building', 'Advanced computer lab with 100+ workstations', 'CSL', 29.375780, 79.530650, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGRnZuf7YjrN7UG3U9r02h6kb7hR-CNS0QFg&s'),
(5, 'Administration Block', 'building', 'Main administrative offices including registrar and finance', 'ADM', 29.375280, 79.530680, 'https://www.addressguru.in/images/1591699115.png'),
(6, 'Volleyball Ground', 'facility', 'Outdoor sports facility for volleyball', 'VBG', 29.375920, 79.530980, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjuhZ3iIA85YaCu347wKOAtvkmCalDDI3wjw&s'),
(7, 'Open Air Theater', 'building', 'Large outdoor auditorium for events and performances', 'OAT', 29.375150, 79.530950, 'https://gehu.ac.in/blog/public/upload/seo/20250711103143.webp'),
(8, 'B Block', 'building', 'Academic building with classrooms and labs', 'BB', 29.375850, 79.531250, 'https://image-static.collegedunia.com/public/college_data/images/appImage/57212_cover2.jpg'),
(9, 'C D and E Block', 'building', 'Multi-purpose academic buildings', 'CDE', 29.375950, 79.531350, 'https://d.gehu.ac.in/uploads/image/bhimtal-gallery-5-300x225.webp');

--  PATHS TABLE 
CREATE TABLE paths (
    path_id INT PRIMARY KEY AUTO_INCREMENT,
    from_location_id INT NOT NULL,
    to_location_id INT NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    estimated_time INT NOT NULL,
    path_type ENUM('walking', 'cycling', 'vehicle') DEFAULT 'walking',
    is_covered BOOLEAN DEFAULT FALSE,
    has_stairs BOOLEAN DEFAULT FALSE,
    path_condition ENUM('good', 'fair', 'poor') DEFAULT 'good',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    FOREIGN KEY (to_location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_from_location (from_location_id),
    INDEX idx_to_location (to_location_id),
    INDEX idx_path_type (path_type),
    UNIQUE KEY unique_path (from_location_id, to_location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert bidirectional paths
INSERT INTO paths (from_location_id, to_location_id, distance, estimated_time, is_covered, has_stairs) VALUES
-- From Main Gate
(1, 2, 150, 120, FALSE, FALSE),
(2, 1, 150, 120, FALSE, FALSE),
(1, 7, 100, 80, FALSE, FALSE),
(7, 1, 100, 80, FALSE, FALSE),

-- From Library
(2, 3, 120, 96, TRUE, FALSE),
(3, 2, 120, 96, TRUE, FALSE),
(2, 4, 180, 144, FALSE, FALSE),
(4, 2, 180, 144, FALSE, FALSE),

-- From Cafeteria
(3, 5, 90, 72, FALSE, FALSE),
(5, 3, 90, 72, FALSE, FALSE),
(3, 7, 110, 88, FALSE, FALSE),
(7, 3, 110, 88, FALSE, FALSE),

-- From Computer Lab
(4, 6, 200, 160, FALSE, FALSE),
(6, 4, 200, 160, FALSE, FALSE),
(4, 5, 95, 76, FALSE, TRUE),
(5, 4, 95, 76, FALSE, TRUE),

-- From Admin Block
(5, 7, 80, 64, TRUE, FALSE),
(7, 5, 80, 64, TRUE, FALSE),

-- From Sports Complex
(6, 8, 150, 120, FALSE, FALSE),
(8, 6, 150, 120, FALSE, FALSE);

--  NAVIGATION HISTORY TABLE 
CREATE TABLE navigation_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    from_location_id INT NOT NULL,
    to_location_id INT NOT NULL,
    distance_traveled DECIMAL(10, 2),
    time_taken INT,
    navigation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (from_location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    FOREIGN KEY (to_location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_navigation_date (navigation_date),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--  CAMPUS IMAGES TABLE 
CREATE TABLE campus_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_title VARCHAR(100),
    caption TEXT,
    image_type ENUM('exterior', 'interior', 'aerial', 'map') DEFAULT 'exterior',
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_location_id (location_id),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample images
INSERT INTO campus_images (location_id, image_url, image_title, caption, image_type, is_primary) VALUES
(1, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFmmWRQGshSRuZWyZNVipAxCtRrrBpPnO7LA&s', 'Main Gate', 'Welcome to our campus', 'exterior', TRUE),
(2, 'https://images.shiksha.com/mediadata/images/1689075683phpwmRg1B.jpeg', 'Central Library', 'Knowledge hub of campus', 'exterior', TRUE),
(4, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGRnZuf7YjrN7UG3U9r02h6kb7hR-CNS0QFg&s', 'Computer Lab', 'State-of-the-art computing facility', 'interior', TRUE),
(5, 'https://www.addressguru.in/images/1591699115.png', 'Administration', 'Administrative offices', 'exterior', TRUE),
(6, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjuhZ3iIA85YaCu347wKOAtvkmCalDDI3wjw&s', 'Sports Complex', 'Indoor sports facilities', 'interior', TRUE),
(7, 'https://gehu.ac.in/blog/public/upload/seo/20250711103143.webp', 'Auditorium', 'Main event hall', 'interior', TRUE);

--  FACILITIES TABLE 
CREATE TABLE facilities (
    facility_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT NOT NULL,
    facility_name VARCHAR(100) NOT NULL,
    facility_type ENUM('restroom', 'atm', 'parking', 'wifi', 'water', 'locker', 'printing', 'air_conditioning', 'av_equipment', 'study_area') NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_location_id (location_id),
    INDEX idx_facility_type (facility_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample facilities
INSERT INTO facilities (location_id, facility_name, facility_type) VALUES
(2, 'WiFi Zone', 'wifi'),
(2, 'Reading Rooms', 'study_area'),
(2, 'Restrooms', 'restroom'),
(3, 'ATM Machine', 'atm'),
(3, 'Water Cooler', 'water'),
(3, 'Restrooms', 'restroom'),
(4, 'WiFi Zone', 'wifi'),
(4, 'Printing Service', 'printing'),
(4, 'Air Conditioning', 'air_conditioning'),
(6, 'Locker Rooms', 'locker'),
(6, 'Water Fountain', 'water'),
(6, 'Restrooms', 'restroom'),
(7, 'AC Auditorium', 'air_conditioning'),
(7, 'Audio Visual', 'av_equipment'),
(7, 'Restrooms', 'restroom');

--  LOCATION ITEMS TABLE (NEW) 
-- For storing classes, labs, and other items within locations
CREATE TABLE location_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    floor VARCHAR(50),
    capacity VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    INDEX idx_location_id (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample location items
INSERT INTO location_items (location_id, item_name, floor, capacity, description) VALUES
(2, 'Reference Section', 'Ground Floor', '100 students', 'Reference books and journals section'),
(2, 'Digital Library', '1st Floor', '50 students', 'Computer workstations for digital resources'),
(4, 'Computer Lab 101', 'Ground Floor', '60 students', 'Programming lab with latest software'),
(4, 'Computer Lab 102', '1st Floor', '50 students', 'Networking and security lab'),
(5, 'Registrar Office', 'Ground Floor', NULL, 'Student registration and records'),
(5, 'Finance Office', 'Ground Floor', NULL, 'Fee payment and financial matters'),
(7, 'Main Hall', 'Ground Floor', '500 people', 'Main auditorium hall for events'),
(8, 'Common Room', 'Ground Floor', '80 students', 'Recreation and TV room');

--  VIEWS FOR ANALYTICS 

-- View: Popular routes
CREATE OR REPLACE VIEW v_popular_routes AS
SELECT 
    l1.location_name as from_location,
    l2.location_name as to_location,
    COUNT(*) as usage_count,
    AVG(nh.distance_traveled) as avg_distance,
    AVG(nh.time_taken) as avg_time
FROM navigation_history nh
JOIN locations l1 ON nh.from_location_id = l1.location_id
JOIN locations l2 ON nh.to_location_id = l2.location_id
WHERE nh.completed = TRUE
GROUP BY nh.from_location_id, nh.to_location_id
ORDER BY usage_count DESC;

-- View: User activity summary
CREATE OR REPLACE VIEW v_user_activity AS
SELECT 
    u.user_id,
    u.username,
    u.full_name,
    u.user_type,
    COUNT(nh.history_id) as total_navigations,
    SUM(nh.distance_traveled) as total_distance,
    u.last_login
FROM users u
LEFT JOIN navigation_history nh ON u.user_id = nh.user_id
GROUP BY u.user_id
ORDER BY total_navigations DESC;

-- View: Location popularity
CREATE OR REPLACE VIEW v_location_popularity AS
SELECT 
    l.location_id,
    l.location_name,
    l.location_type,
    COUNT(DISTINCT nh1.history_id) + COUNT(DISTINCT nh2.history_id) as total_visits
FROM locations l
LEFT JOIN navigation_history nh1 ON l.location_id = nh1.from_location_id
LEFT JOIN navigation_history nh2 ON l.location_id = nh2.to_location_id
GROUP BY l.location_id
ORDER BY total_visits DESC;

--  STORED PROCEDURES 

-- Procedure to get shortest path (will be used with Dijkstra's algorithm)
DELIMITER //

CREATE PROCEDURE GetPathBetweenLocations(
    IN start_location INT,
    IN end_location INT
)
BEGIN
    SELECT 
        p.*,
        l1.location_name as from_location_name,
        l2.location_name as to_location_name
    FROM paths p
    JOIN locations l1 ON p.from_location_id = l1.location_id
    JOIN locations l2 ON p.to_location_id = l2.location_id
    WHERE p.from_location_id = start_location 
    AND p.to_location_id = end_location;
END //

-- Procedure to record navigation
CREATE PROCEDURE RecordNavigation(
    IN p_user_id INT,
    IN p_from_location INT,
    IN p_to_location INT,
    IN p_distance DECIMAL(10,2),
    IN p_time INT
)
BEGIN
    INSERT INTO navigation_history 
    (user_id, from_location_id, to_location_id, distance_traveled, time_taken, completed)
    VALUES 
    (p_user_id, p_from_location, p_to_location, p_distance, p_time, TRUE);
    
    SELECT LAST_INSERT_ID() as history_id;
END //

-- Procedure to get user statistics
CREATE PROCEDURE GetUserStatistics(IN p_user_id INT)
BEGIN
    SELECT 
        COUNT(*) as total_navigations,
        SUM(distance_traveled) as total_distance,
        AVG(time_taken) as avg_time,
        MAX(navigation_date) as last_navigation
    FROM navigation_history
    WHERE user_id = p_user_id AND completed = TRUE;
END //

DELIMITER ;

--  TRIGGERS 

-- Trigger to update location's last_updated timestamp
DELIMITER //

CREATE TRIGGER trg_update_location_timestamp
BEFORE UPDATE ON locations
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //

-- Trigger to prevent duplicate primary images
CREATE TRIGGER trg_campus_images_primary
BEFORE INSERT ON campus_images
FOR EACH ROW
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE campus_images 
        SET is_primary = FALSE 
        WHERE location_id = NEW.location_id;
    END IF;
END //

DELIMITER ;

--  INDEXES FOR PERFORMANCE 

-- Additional composite indexes for better query performance
CREATE INDEX idx_navigation_user_date ON navigation_history(user_id, navigation_date);
CREATE INDEX idx_paths_distance ON paths(distance);
CREATE INDEX idx_users_active ON users(is_active, user_type);

--  SAMPLE DATA FOR TESTING 

-- Add some sample test users
INSERT INTO users (username, password, full_name, email, user_type) VALUES
('john_doe', '$2a$10$rBV2HDeWwmkUy3.9OWrz0OqP7W5p5tJZ1xCnYdWYoqKJz8H8cXZzO', 'John Doe', 'john@campus.edu', 'student'),
('jane_smith', '$2a$10$rBV2HDeWwmkUy3.9OWrz0OqP7W5p5tJZ1xCnYdWYoqKJz8H8cXZzO', 'Jane Smith', 'jane@campus.edu', 'faculty'),
('bob_visitor', '$2a$10$rBV2HDeWwmkUy3.9OWrz0OqP7W5p5tJZ1xCnYdWYoqKJz8H8cXZzO', 'Bob Wilson', 'bob@gmail.com', 'visitor');

--  GRANT PERMISSIONS 
-- Note: Adjust these permissions based on your security requirements

-- GRANT SELECT, INSERT, UPDATE, DELETE ON smart_campus_navigator.* TO 'campus_user'@'localhost' IDENTIFIED BY 'secure_password';
-- FLUSH PRIVILEGES;

--  DATABASE INFORMATION 

SELECT 'Database Schema Created Successfully!' as Status;
SELECT COUNT(*) as TotalTables FROM information_schema.tables WHERE table_schema = 'smart_campus_navigator';
SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'smart_campus_navigator' ORDER BY table_name;
