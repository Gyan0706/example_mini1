const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const FinancialInfo = require('./models/FinancialInfo');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect('mongodb://127.0.0.1:27017/userDB', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB:', err));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Register endpoint
app.post('/register', upload.single('file'), async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password || !req.file) {
        return res.status(400).send('All fields and a file are required.');
    }

    try {
        // Extract JSON data from file
        const filePath = req.file.path;
        const fileData = fs.readFileSync(filePath, 'utf8');

        let jsonData;
        try {
            jsonData = JSON.parse(fileData);  // Try parsing the JSON data
        } catch (err) {
            return res.status(400).send('Invalid JSON file format.');
        }

        // Validate the JSON structure
        if (!jsonData.MonthlyIncome || !jsonData.MonthlyExpend || !jsonData.LoanRequest) {
            return res.status(400).send('Missing required financial data in the uploaded file.');
        }

        // Create a new financialInfo entry
        const newFinancialInfo = new FinancialInfo({
            MonthlyIncome: jsonData.MonthlyIncome,
            MonthlyExpend: jsonData.MonthlyExpend,
            LoanRequest: jsonData.LoanRequest,
            outstandingDebt: jsonData.outstandingDebt,
            totalAssets: jsonData.totalAssets,
            totalLiabilities: jsonData.totalLiabilities,
            loanHistory: jsonData.loanHistory,
        });

        await newFinancialInfo.save();

        // Save user to the database with a reference to the financialInfo and plain password
        const newUser = new User({
            username,
            email,
            password, // Save the plain text password
            financialInfo: newFinancialInfo._id, // Reference to financial info
        });

        await newUser.save();

        res.status(201).send('User registered successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering user: ' + err.message);
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Invalid credentials');
        }

        // Check if password matches
        if (user.password !== password) {
            return res.status(401).send('Invalid credentials');
        }

        res.status(200).json({ message: 'Login successful!', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error logging in: ' + err.message);
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
