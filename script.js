// Priority Queue Implementation for Dijkstra's Algorithm
class PriorityQueue {
    constructor() {
        this.values = [];
    }

    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }

    dequeue() {
        return this.values.shift();
    }

    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }

    isEmpty() {
        return this.values.length === 0;
    }
}

// Graph Data Structure using Adjacency List
class Graph {
    constructor() {
        this.adjacencyList = {};
        this.locations = {};
    }

    addVertex(vertex, name) {
        if (!this.adjacencyList[vertex]) {
            this.adjacencyList[vertex] = [];
            this.locations[vertex] = name;
        }
    }

    addEdge(vertex1, vertex2, weight) {
        this.adjacencyList[vertex1].push({ node: vertex2, weight });
        this.adjacencyList[vertex2].push({ node: vertex1, weight });
    }

    dijkstra(start, finish) {
        const distances = {};
        const previous = {};
        const pq = new PriorityQueue();
        let path = [];

        for (let vertex in this.adjacencyList) {
            if (vertex === start) {
                distances[vertex] = 0;
                pq.enqueue(vertex, 0);
            } else {
                distances[vertex] = Infinity;
                pq.enqueue(vertex, Infinity);
            }
            previous[vertex] = null;
        }

        while (!pq.isEmpty()) {
            let smallest = pq.dequeue().val;

            if (smallest === finish) {
                while (previous[smallest]) {
                    path.push(smallest);
                    smallest = previous[smallest];
                }
                break;
            }

            if (smallest || distances[smallest] !== Infinity) {
                for (let neighbor in this.adjacencyList[smallest]) {
                    let nextNode = this.adjacencyList[smallest][neighbor];
                    let candidate = distances[smallest] + nextNode.weight;

                    if (candidate < distances[nextNode.node]) {
                        distances[nextNode.node] = candidate;
                        previous[nextNode.node] = smallest;
                        pq.enqueue(nextNode.node, candidate);
                    }
                }
            }
        }

        path.push(start);
        path.reverse();

        return {
            distance: distances[finish],
            path: path
        };
    }

    // Find all possible paths using DFS
    findAllPaths(start, end, maxDepth = 10) {
        const allPaths = [];
        const visited = new Set();

        const dfs = (current, target, path, distance) => {
            if (path.length > maxDepth) return;
            
            if (current === target) {
                allPaths.push({
                    path: [...path],
                    distance: distance
                });
                return;
            }

            visited.add(current);

            for (let neighbor of this.adjacencyList[current]) {
                if (!visited.has(neighbor.node)) {
                    dfs(
                        neighbor.node,
                        target,
                        [...path, neighbor.node],
                        distance + neighbor.weight
                    );
                }
            }

            visited.delete(current);
        };

        dfs(start, end, [start], 0);

        // Sort paths by distance
        allPaths.sort((a, b) => a.distance - b.distance);

        return allPaths;
    }

    getLocationName(id) {
        return this.locations[id] || 'Unknown';
    }
}

// Initialize Graph
const campusGraph = new Graph();

// Campus Locations Data
const campusLocations = {
    1: { name: 'Main Gate', type: 'Entrance' },
    2: { name: 'Central Library', type: 'Academic Building' },
    3: { name: 'Student Cafeteria', type: 'Dining Facility' },
    4: { name: 'Computer Science Lab', type: 'Academic Building' },
    5: { name: 'Administration Block', type: 'Administrative Building' },
    6: { name: 'Sports Complex', type: 'Sports Facility' },
    7: { name: 'Main Auditorium', type: 'Event Hall' },
    8: { name: 'Hostel Block A', type: 'Accommodation' }
};

// Add vertices to graph
for (let id in campusLocations) {
    campusGraph.addVertex(id, campusLocations[id].name);
}

// Campus Paths
const campusPaths = [
    { from: '1', to: '2', distance: 150, time: 120 },
    { from: '1', to: '7', distance: 100, time: 80 },
    { from: '2', to: '3', distance: 120, time: 96 },
    { from: '2', to: '4', distance: 180, time: 144 },
    { from: '3', to: '5', distance: 90, time: 72 },
    { from: '4', to: '6', distance: 200, time: 160 },
    { from: '5', to: '7', distance: 80, time: 64 },
    { from: '6', to: '8', distance: 150, time: 120 },
    { from: '3', to: '7', distance: 110, time: 88 },
    { from: '4', to: '5', distance: 95, time: 76 },
];

const pathDetails = {};
campusPaths.forEach(path => {
    const key = `${path.from}-${path.to}`;
    const reverseKey = `${path.to}-${path.from}`;
    pathDetails[key] = { distance: path.distance, time: path.time };
    pathDetails[reverseKey] = { distance: path.distance, time: path.time };
});

campusPaths.forEach(path => {
    campusGraph.addEdge(path.from, path.to, path.distance);
});

// Location coordinates
const locationCoordinates = {
    '1': { name: 'Main Gate', lat: 29.375481, lng: 79.530486 },
    '2': { name: 'Central Library', lat: 29.375620, lng: 79.530850 },
    '3': { name: 'Student Cafeteria', lat: 29.375350, lng: 79.530920 },
    '4': { name: 'Computer Science Lab', lat: 29.375780, lng: 79.530650 },
    '5': { name: 'Administration Block', lat: 29.375280, lng: 79.530680 },
    '6': { name: 'Sports Complex', lat: 29.375920, lng: 79.530980 },
    '7': { name: 'Main Auditorium', lat: 29.375150, lng: 79.530950 },
    '8': { name: 'Hostel Block A', lat: 29.375850, lng: 79.531250 }
};

// Default users
const defaultUsers = [
    { username: 'admin', password: 'admin123', name: 'Admin User', email: 'admin@campus.edu', userType: 'admin' }
];

let users = [...defaultUsers];

// Application State
let currentUser = null;
let currentLocationId = null;
let currentRouteData = null;

// Load users from localStorage
function loadUsers() {
    const savedUsers = localStorage.getItem('campusUsers');
    if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        users = [...defaultUsers, ...parsed.filter(u => u.username !== 'admin')];
    }
}

// Save users to localStorage
function saveUsers() {
    const registeredUsers = users.filter(u => u.username !== 'admin');
    localStorage.setItem('campusUsers', JSON.stringify(registeredUsers));
}

// Location Items Storage
const locationItems = {};

function loadLocationItems() {
    const saved = localStorage.getItem('campusLocationItems');
    if (saved) {
        Object.assign(locationItems, JSON.parse(saved));
    }
}

function saveLocationItems() {
    localStorage.setItem('campusLocationItems', JSON.stringify(locationItems));
}

// Helper Functions
function navigateToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
        return `${remainingSeconds} sec`;
    } else if (remainingSeconds === 0) {
        return `${minutes} min`;
    } else {
        return `${minutes} min ${remainingSeconds} sec`;
    }
}

function getPathDetail(from, to) {
    const key = `${from}-${to}`;
    return pathDetails[key] || { distance: 0, time: 0 };
}

// Auth Page Navigation Functions
function showLoginPage(e) {
    if (e) e.preventDefault();
    navigateToPage('loginPage');
}

function showRegisterPage(e) {
    if (e) e.preventDefault();
    navigateToPage('registerPage');
}

function showForgotPasswordPage(e) {
    if (e) e.preventDefault();
    navigateToPage('forgotPasswordPage');
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadLocationItems();
    
    // LOGIN FORM
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                currentUser = user;
                document.getElementById('userDisplay').textContent = user.name;
                
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                
                navigateToPage('galleryPage');
            } else {
                alert('Invalid username or password!');
            }
        });
    }
    
    // REGISTER FORM
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('regFullName').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const userType = document.getElementById('regUserType').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters long!');
                return;
            }
            
            if (users.find(u => u.username === username)) {
                alert('Username already exists! Please choose a different username.');
                return;
            }
            
            if (users.find(u => u.email === email)) {
                alert('Email already registered! Please use a different email.');
                return;
            }
            
            const newUser = {
                username: username,
                password: password,
                name: fullName,
                email: email,
                userType: userType,
                registeredAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveUsers();
            
            registerForm.reset();
            alert(' Registration successful! You can now login with your credentials.');
            showLoginPage(new Event('click'));
        });
    }
    
    // FORGOT PASSWORD FORM
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('forgotUsername').value.trim();
            const email = document.getElementById('forgotEmail').value.trim();
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters long!');
                return;
            }
            
            const userIndex = users.findIndex(u => u.username === username && u.email === email);
            
            if (userIndex === -1) {
                alert('User not found! Please check your username and email.');
                return;
            }
            
            if (username === 'admin') {
                alert('Cannot reset admin password!');
                return;
            }
            
            users[userIndex].password = newPassword;
            saveUsers();
            
            forgotPasswordForm.reset();
            alert('✅ Password reset successful! You can now login with your new password.');
            showLoginPage(new Event('click'));
        });
    }
    
    // GALLERY ITEMS CLICK
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const locationId = this.getAttribute('data-location');
            const locationName = this.querySelector('h3').textContent;
            openLocationModal(locationId, locationName);
        });
    });
    
    // LOCATION ITEM FORM
    const locationItemForm = document.getElementById('locationItemForm');
    if (locationItemForm) {
        locationItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addLocationItem();
        });
    }
    
    // ROUTE FORM
    const routeForm = document.getElementById('routeForm');
    if (routeForm) {
        routeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const startLocation = document.getElementById('startLocation').value;
            const endLocation = document.getElementById('endLocation').value;
            
            if (!startLocation || !endLocation) {
                alert('Please select both starting point and destination!');
                return;
            }
            
            if (startLocation === endLocation) {
                alert('Starting point and destination cannot be the same!');
                return;
            }
            
            // Find all paths
            const allPaths = campusGraph.findAllPaths(startLocation, endLocation);
            
            if (allPaths.length === 0) {
                alert('No route found between these locations!');
                return;
            }
            
            // Store route data
            currentRouteData = {
                start: startLocation,
                end: endLocation,
                allPaths: allPaths,
                shortestPath: allPaths[0]
            };
            
            // Display all paths
            displayAllPaths(currentRouteData);
            
            // Navigate to path visualization page
            navigateToPage('pathVisualizationPage');
        });
    }
});

// Display all paths with highlighting
function displayAllPaths(routeData) {
    const { start, end, allPaths } = routeData;
    
    // Update endpoint names
    document.getElementById('startPointName').textContent = campusGraph.getLocationName(start);
    document.getElementById('endPointName').textContent = campusGraph.getLocationName(end);
    
    // Display all paths
    const pathsList = document.getElementById('allPathsList');
    pathsList.innerHTML = '';
    
    allPaths.forEach((pathData, index) => {
        const isShortestPath = index === 0;
        const pathCard = createPathCard(pathData, index + 1, isShortestPath);
        pathsList.appendChild(pathCard);
    });
}

// Create path card element
function createPathCard(pathData, pathNumber, isShortestPath) {
    const { path, distance } = pathData;
    
    // Calculate total time
    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const detail = getPathDetail(path[i], path[i + 1]);
        totalTime += detail.time;
    }
    
    const card = document.createElement('div');
    card.className = `path-card ${isShortestPath ? 'shortest-path' : ''}`;
    
    const pathSteps = path.map(nodeId => campusGraph.getLocationName(nodeId)).join(' → ');
    
    card.innerHTML = `
        <div class="path-card-header">
            <div class="path-number">${isShortestPath ? '🏆' : pathNumber}</div>
            <div class="path-info">
                <div class="path-title">
                    ${isShortestPath ? '<span class="badge-shortest">Shortest Route</span>' : `Route ${pathNumber}`}
                </div>
                <div class="path-stats">
                    <span class="path-stat">📏 ${distance}m</span>
                    <span class="path-stat">⏱️ ${formatTime(totalTime)}</span>
            
                </div>
            </div>
        </div>
        <div class="path-route">
            ${pathSteps}
        </div>
    `;
    
    return card;
}

// Open Google Maps with shortest route
function openGoogleMaps() {
    if (!currentRouteData) return;
    
    const { start, end } = currentRouteData;
    const startCoords = locationCoordinates[start];
    const endCoords = locationCoordinates[end];
    
    if (!startCoords || !endCoords) {
        alert('Location coordinates not found!');
        return;
    }
    
    const mapsUrl = `https://www.google.com/maps/d/edit?mid=1m_lTfIqPy9DIn4tpo67cf57N0z_u7Wo&usp=sharing${startCoords.lat},${startCoords.lng}/${endCoords.lat},${endCoords.lng}`;
    window.open(mapsUrl, '_blank');
}

// Display detailed route
function displayRoute(result) {
    const { distance, path } = result;
    
    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const detail = getPathDetail(path[i], path[i + 1]);
        totalTime += detail.time;
    }
    
    document.getElementById('totalDistance').textContent = `${distance} m`;
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('totalSteps').textContent = path.length - 1;
    
    const routeStepsContainer = document.getElementById('routeSteps');
    routeStepsContainer.innerHTML = '';
    
    const startHTML = `
        <div class="step">
            <div class="step-number">🚀</div>
            <div class="step-content">
                <div class="step-direction">
                    <strong>Starting Point: ${campusGraph.getLocationName(path[0])}</strong>
                </div>
                <div class="step-details">
                    <span class="step-detail-item"> Begin your journey here</span>
                </div>
            </div>
        </div>
    `;
    routeStepsContainer.innerHTML += startHTML;
    
    for (let i = 0; i < path.length - 1; i++) {
        const fromId = path[i];
        const toId = path[i + 1];
        const fromName = campusGraph.getLocationName(fromId);
        const toName = campusGraph.getLocationName(toId);
        const detail = getPathDetail(fromId, toId);
        
        const stepHTML = `
            <div class="step">
                <div class="step-number">${i + 1}</div>
                <div class="step-content">
                    <div class="step-direction">
                        <span>${fromName}</span>
                        <span class="step-arrow">→</span>
                        <span>${toName}</span>
                    </div>
                    <div class="step-details">
                        <span class="step-detail-item">📏 ${detail.distance}m</span>
                        <span class="step-detail-item">⏱️ ${formatTime(detail.time)}</span>
                    </div>
                </div>
            </div>
        `;
        routeStepsContainer.innerHTML += stepHTML;
    }
    
    const endHTML = `
        <div class="step final-step">
            <div class="step-number">✓</div>
            <div class="step-content">
                <div class="step-direction">
                    <strong>Destination Reached: ${campusGraph.getLocationName(path[path.length - 1])}</strong>
                </div>
                <div class="step-details">
                    <span class="step-detail-item"> You have arrived at your destination!</span>
                </div>
            </div>
        </div>
    `;
    routeStepsContainer.innerHTML += endHTML;
}

// When navigating to route page, display the shortest path
document.addEventListener('DOMContentLoaded', function() {
    const originalNavigate = window.navigateToPage;
    window.navigateToPage = function(pageId) {
        if (pageId === 'routePage' && currentRouteData) {
            displayRoute(currentRouteData.shortestPath);
        }
        originalNavigate(pageId);
    };
});

// Location Modal Functions
function openLocationModal(locationId, locationName) {
    currentLocationId = locationId;
    const modal = document.getElementById('locationModal');
    const modalTitle = document.getElementById('locationModalTitle');
    const adminFormSection = document.getElementById('adminFormSection');
    
    modalTitle.textContent = `📍 ${locationName}`;
    
    if (currentUser && currentUser.username === 'admin') {
        adminFormSection.style.display = 'block';
    } else {
        adminFormSection.style.display = 'none';
    }
    
    document.getElementById('locationItemForm').reset();
    loadLocationItemsList(locationId);
    modal.classList.add('active');
}

function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    modal.classList.remove('active');
    currentLocationId = null;
}

function addLocationItem() {
    if (!currentLocationId) return;
    
    const newItem = {
        id: Date.now(),
        name: document.getElementById('className').value.trim(),
        floor: document.getElementById('classFloor').value.trim(),
        capacity: document.getElementById('classCapacity').value.trim(),
        description: document.getElementById('classDescription').value.trim(),
        createdAt: new Date().toISOString()
    };
    
    if (!locationItems[currentLocationId]) {
        locationItems[currentLocationId] = [];
    }
    
    locationItems[currentLocationId].push(newItem);
    saveLocationItems();
    document.getElementById('locationItemForm').reset();
    loadLocationItemsList(currentLocationId);
    alert(' Class/Lab added successfully!');
}

function loadLocationItemsList(locationId) {
    const itemsList = document.getElementById('locationItemsList');
    const items = locationItems[locationId] || [];
    const isAdmin = currentUser && currentUser.username === 'admin';
    
    if (items.length === 0) {
        itemsList.innerHTML = `
            <div class="location-empty-state">
                <div class="location-empty-state-icon">📭</div>
                <p>No classes or labs added yet.${isAdmin ? '<br>Use the form above to add your first one!' : ''}</p>
            </div>
        `;
        return;
    }
    
    itemsList.innerHTML = items.map((item, index) => `
        <div class="location-item-card">
            <div class="location-item-header">
                <div>
                    <div class="location-item-title">📚 ${item.name}</div>
                    <div class="location-item-meta">
                        ${item.floor ? `<span>🔢 ${item.floor}</span>` : ''}
                        ${item.capacity ? `<span>👥 ${item.capacity}</span>` : ''}
                    </div>
                </div>
                ${isAdmin ? `
                <div class="location-item-actions">
                    <button class="btn-delete-item" onclick="deleteLocationItem('${locationId}', ${index})">
                        🗑️ Delete
                    </button>
                </div>
                ` : ''}
            </div>
            ${item.description ? `<div class="location-item-description">${item.description}</div>` : ''}
        </div>
    `).join('');
}

function deleteLocationItem(locationId, index) {
    if (confirm('Are you sure you want to delete this class/lab?')) {
        locationItems[locationId].splice(index, 1);
        saveLocationItems();
        loadLocationItemsList(locationId);
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('locationModal');
    if (event.target === modal) {
        closeLocationModal();
    }
};

// Logout Function
function logout() {
    currentUser = null;
    currentRouteData = null;
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('startLocation').value = '';
    document.getElementById('endLocation').value = '';
    
    navigateToPage('loginPage');
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const currentPage = document.querySelector('.page.active');
        
        if (currentPage.id === 'routePage') {
            navigateToPage('pathVisualizationPage');
        } else if (currentPage.id === 'pathVisualizationPage') {
            navigateToPage('navigationPage');
        } else if (currentPage.id === 'navigationPage') {
            navigateToPage('galleryPage');
        }
    }
});

console.log('Smart Campus Navigator - Initialized');
console.log('Features: Custom Registration, Password Recovery, Multi-Path Visualization');
