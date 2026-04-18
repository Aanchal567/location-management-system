const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Session setup
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Make user available in all views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// Create uploads folder
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ============ USER DATABASE (In-memory) ============
const users = [];
let nextUserId = 1;

// ============ LOCATIONS DATABASE (Per user) ============
let allLocations = [];
let nextLocationId = 1;

// City database
const cityDatabase = {
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'jalandhar': { lat: 31.3260, lng: 75.5762 },
    'amritsar': { lat: 31.6340, lng: 74.8723 },
    'ludhiana': { lat: 30.9010, lng: 75.8573 },
    'chandigarh': { lat: 30.7333, lng: 76.7794 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'bangalore': { lat: 12.9716, lng: 77.5946 }
};

function getCityCoordinates(cityName) {
    const cityLower = cityName.toLowerCase().trim();
    if (cityDatabase[cityLower]) {
        return cityDatabase[cityLower];
    }
    return { lat: 28.6139, lng: 77.2090 };
}

// Helper: Get locations for current user
function getUserLocations(userId) {
    return allLocations.filter(l => l.userId === userId);
}

// ============ PASSPORT CONFIGURATION ============
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        const user = users.find(u => u.email === email);
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Invalid password' });
        }
        
        return done(null, user);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
});

// ============ AUTHENTICATION MIDDLEWARE ============
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function isGuest(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/locations');
}

// ============ AUTH ROUTES ============

// Register page
app.get('/register', isGuest, (req, res) => {
    res.render('register');
});

// Register user
app.post('/register', isGuest, async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    
    // Validation
    if (!name || !email || !password) {
        return res.send('All fields required! <a href="/register">Try again</a>');
    }
    
    if (password !== confirmPassword) {
        return res.send('Passwords do not match! <a href="/register">Try again</a>');
    }
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.send('User already exists! <a href="/login">Login</a>');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
        id: nextUserId++,
        name: name,
        email: email,
        password: hashedPassword,
        createdAt: new Date()
    };
    
    users.push(newUser);
    
    // Auto login after registration
    req.login(newUser, (err) => {
        if (err) return next(err);
        res.redirect('/locations');
    });
});

// Login page
app.get('/login', isGuest, (req, res) => {
    res.render('login', { error: req.query.error });
});

// Login handler
app.post('/login', isGuest, passport.authenticate('local', {
    successRedirect: '/locations',
    failureRedirect: '/login?error=1'
}));

// Logout
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// ============ PROTECTED ROUTES (Require Login) ============

// Dashboard
app.get('/', isAuthenticated, (req, res) => {
    res.redirect('/locations');
});

// View all locations (only user's own locations)
app.get('/locations', isAuthenticated, (req, res) => {
    const userLocations = getUserLocations(req.user.id);
    
    const stats = {
        total: userLocations.length,
        byType: {
            payment: userLocations.filter(l => l.type === 'payment').length,
            event: userLocations.filter(l => l.type === 'event').length,
            delivery: userLocations.filter(l => l.type === 'delivery').length
        },
        recent: userLocations.slice(-5).reverse()
    };
    
    res.render('locations', { 
        locations: userLocations,
        stats: stats,
        user: req.user
    });
});

// Add location form
app.get('/add', isAuthenticated, (req, res) => {
    const citiesList = Object.keys(cityDatabase).sort();
    res.render('form', { edit: null, cities: citiesList });
});

// Add location
app.post('/add', isAuthenticated, upload.single('document'), (req, res) => {
    const { name, type, info, city } = req.body;
    const coords = getCityCoordinates(city);
    
    const newLocation = {
        id: nextLocationId++,
        userId: req.user.id,
        name: name,
        type: type,
        info: info,
        city: city,
        lat: coords.lat,
        lng: coords.lng,
        document: req.file ? req.file.filename : null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    allLocations.push(newLocation);
    res.redirect('/locations');
});

// Edit form
app.get('/edit/:id', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id);
    const location = allLocations.find(l => l.id === id && l.userId === req.user.id);
    const citiesList = Object.keys(cityDatabase).sort();
    
    if (location) {
        res.render('form', { edit: location, cities: citiesList });
    } else {
        res.redirect('/locations');
    }
});

// Update location
app.post('/update/:id', isAuthenticated, upload.single('document'), (req, res) => {
    const id = parseInt(req.params.id);
    const { name, type, info, city } = req.body;
    const coords = getCityCoordinates(city);
    
    const index = allLocations.findIndex(l => l.id === id && l.userId === req.user.id);
    if (index !== -1) {
        allLocations[index] = {
            ...allLocations[index],
            name: name,
            type: type,
            info: info,
            city: city,
            lat: coords.lat,
            lng: coords.lng,
            document: req.file ? req.file.filename : allLocations[index].document,
            updatedAt: new Date()
        };
    }
    
    res.redirect('/locations');
});

// Delete location
app.get('/delete/:id', isAuthenticated, (req, res) => {
    const id = parseInt(req.params.id);
    const index = allLocations.findIndex(l => l.id === id && l.userId === req.user.id);
    
    if (index !== -1) {
        if (allLocations[index].document) {
            const filePath = path.join(__dirname, 'uploads', allLocations[index].document);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        allLocations.splice(index, 1);
    }
    
    res.redirect('/locations');
});

// Delete all user locations
app.get('/delete-all', isAuthenticated, (req, res) => {
    const userLocations = getUserLocations(req.user.id);
    
    userLocations.forEach(location => {
        if (location.document) {
            const filePath = path.join(__dirname, 'uploads', location.document);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });
    
    allLocations = allLocations.filter(l => l.userId !== req.user.id);
    res.redirect('/locations');
});

// API for map (only user's locations)
app.get('/api/locations', isAuthenticated, (req, res) => {
    const userLocations = getUserLocations(req.user.id);
    res.json(userLocations);
});

// Profile page
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

// Start server
app.listen(3000, () => {
    console.log('\n========================================');
    console.log('✅ LOCATION APP WITH AUTH IS RUNNING!');
    console.log('========================================');
    console.log('🔐 REGISTER: http://localhost:3000/register');
    console.log('🔑 LOGIN: http://localhost:3000/login');
    console.log('📍 DASHBOARD: http://localhost:3000/locations');
    console.log('========================================\n');
    console.log('Demo Users:');
    console.log('• Create your own account');
    console.log('• Each user sees only their locations');
    console.log('========================================\n');
});