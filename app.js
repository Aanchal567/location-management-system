require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Import locations data
const locationsData = require('./data/locations');

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
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// Create uploads folder
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ============ MONGODB SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Location Schema
const locationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    info: { type: String, required: true },
    city: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    document: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Location = mongoose.model('Location', locationSchema);

// ============ MONGODB CONNECTION ============
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
})
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// ============ API ROUTES FOR LOCATION SELECTOR ============

// Get all countries
app.get('/api/countries', (req, res) => {
    const countries = Object.keys(locationsData).map(key => ({
        code: key,
        name: locationsData[key].name
    }));
    res.json(countries);
});

// Get states by country
app.get('/api/states/:countryCode', (req, res) => {
    const country = locationsData[req.params.countryCode];
    if (!country) {
        return res.json([]);
    }
    const states = Object.keys(country.states).map(key => ({
        code: key,
        name: country.states[key].name
    }));
    res.json(states);
});

// Get cities by country and state
app.get('/api/cities/:countryCode/:stateCode', (req, res) => {
    const country = locationsData[req.params.countryCode];
    if (!country) {
        return res.json([]);
    }
    const state = country.states[req.params.stateCode];
    if (!state) {
        return res.json([]);
    }
    const cities = Object.keys(state.cities).map(key => ({
        code: key,
        name: state.cities[key].name,
        lat: state.cities[key].lat,
        lng: state.cities[key].lng
    }));
    res.json(cities);
});

// Search city API (optional)
app.get('/api/search-city', async (req, res) => {
    const query = req.query.q?.toLowerCase();
    if (!query || query.length < 2) {
        return res.json([]);
    }
    
    const results = [];
    
    for (const countryCode in locationsData) {
        const country = locationsData[countryCode];
        for (const stateCode in country.states) {
            const state = country.states[stateCode];
            for (const cityCode in state.cities) {
                const city = state.cities[cityCode];
                if (city.name.toLowerCase().includes(query)) {
                    results.push({
                        name: city.name,
                        state: state.name,
                        country: country.name,
                        lat: city.lat,
                        lng: city.lng,
                        fullName: `${city.name}, ${state.name}, ${country.name}`
                    });
                }
            }
        }
    }
    
    res.json(results.slice(0, 20));
});

// ============ PASSPORT CONFIGURATION ============
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email });
            if (!user) {
                return done(null, false, { message: 'User not found' });
            }
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return done(null, false, { message: 'Invalid password' });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Middleware for authentication
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
    
    if (!name || !email || !password) {
        return res.send('All fields required! <a href="/register">Try again</a>');
    }
    
    if (password !== confirmPassword) {
        return res.send('Passwords do not match! <a href="/register">Try again</a>');
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.send('User already exists! <a href="/login">Login</a>');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
        name,
        email,
        password: hashedPassword
    });
    
    await newUser.save();
    
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

// Home redirect
app.get('/', isAuthenticated, (req, res) => {
    res.redirect('/locations');
});

// Main dashboard - Table + Map view
app.get('/locations', isAuthenticated, async (req, res) => {
    const userLocations = await Location.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    const stats = {
        total: userLocations.length,
        byType: {
            payment: userLocations.filter(l => l.type === 'payment').length,
            event: userLocations.filter(l => l.type === 'event').length,
            delivery: userLocations.filter(l => l.type === 'delivery').length,
            office: userLocations.filter(l => l.type === 'office').length,
            shop: userLocations.filter(l => l.type === 'shop').length,
            restaurant: userLocations.filter(l => l.type === 'restaurant').length
        },
        recent: userLocations.slice(0, 5)
    };
    
    res.render('locations', { 
        locations: userLocations,
        stats: stats,
        user: req.user
    });
});

// Add location form
app.get('/add', isAuthenticated, (req, res) => {
    res.render('form', { edit: null });
});

// Add location POST - UPDATED for Country/State/City
app.post('/add', isAuthenticated, upload.single('document'), async (req, res) => {
    const { name, type, info, latitude, longitude, city } = req.body;
    
    console.log('Received location data:', { name, type, info, latitude, longitude, city });
    
    // Validate coordinates
    const finalLat = parseFloat(latitude);
    const finalLng = parseFloat(longitude);
    
    if (isNaN(finalLat) || isNaN(finalLng)) {
        console.log('Invalid coordinates, using default Delhi');
        const newLocation = new Location({
            userId: req.user._id,
            name: name,
            type: type,
            info: info,
            city: city || 'Delhi',
            lat: 28.6139,
            lng: 77.2090,
            document: req.file ? req.file.filename : null
        });
        await newLocation.save();
    } else {
        const newLocation = new Location({
            userId: req.user._id,
            name: name,
            type: type,
            info: info,
            city: city || 'Selected City',
            lat: finalLat,
            lng: finalLng,
            document: req.file ? req.file.filename : null
        });
        await newLocation.save();
    }
    
    res.redirect('/locations');
});

// Edit form
app.get('/edit/:id', isAuthenticated, async (req, res) => {
    const id = req.params.id;
    const location = await Location.findOne({ _id: id, userId: req.user._id });
    
    if (location) {
        res.render('form', { edit: location });
    } else {
        res.redirect('/locations');
    }
});

// Update location
app.post('/update/:id', isAuthenticated, upload.single('document'), async (req, res) => {
    const id = req.params.id;
    const { name, type, info, latitude, longitude, city } = req.body;
    
    const finalLat = parseFloat(latitude);
    const finalLng = parseFloat(longitude);
    
    const updateData = {
        name, 
        type, 
        info,
        city: city || 'Updated Location',
        lat: isNaN(finalLat) ? 28.6139 : finalLat,
        lng: isNaN(finalLng) ? 77.2090 : finalLng,
        updatedAt: new Date()
    };
    
    if (req.file) {
        // Delete old file if exists
        const oldLocation = await Location.findOne({ _id: id, userId: req.user._id });
        if (oldLocation && oldLocation.document) {
            const oldFilePath = path.join(__dirname, 'uploads', oldLocation.document);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        updateData.document = req.file.filename;
    }
    
    await Location.updateOne({ _id: id, userId: req.user._id }, updateData);
    res.redirect('/locations');
});

// Delete single location
app.get('/delete/:id', isAuthenticated, async (req, res) => {
    const id = req.params.id;
    const location = await Location.findOne({ _id: id, userId: req.user._id });
    
    if (location && location.document) {
        const filePath = path.join(__dirname, 'uploads', location.document);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    
    await Location.deleteOne({ _id: id, userId: req.user._id });
    res.redirect('/locations');
});

// Delete all user locations
app.get('/delete-all', isAuthenticated, async (req, res) => {
    const userLocations = await Location.find({ userId: req.user._id });
    
    userLocations.forEach(location => {
        if (location.document) {
            const filePath = path.join(__dirname, 'uploads', location.document);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });
    
    await Location.deleteMany({ userId: req.user._id });
    res.redirect('/locations');
});

// API for map - get all user locations
app.get('/api/locations', isAuthenticated, async (req, res) => {
    const userLocations = await Location.find({ userId: req.user._id });
    res.json(userLocations);
});

// Profile page
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`✅ LOCATION APP WITH MONGODB IS RUNNING!`);
    console.log(`========================================`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🔐 Register: http://localhost:${PORT}/register`);
    console.log(`🔑 Login: http://localhost:${PORT}/login`);
    console.log(`📍 Dashboard: http://localhost:${PORT}/locations`);
    console.log(`========================================\n`);
});