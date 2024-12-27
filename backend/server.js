const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const express = require('express');
require('dotenv').config(); // To use environment variables

// Generate a new secret for OTP generation
const secret = otplib.authenticator.generateSecret();

// Generate an OTP using the secret
let token = otplib.authenticator.generate(secret);

// Send OTP function
const sendMessage = async (mobile) => {
  const options = {
    authorization: process.env.FAST2SMS_API_KEY, // API Key from environment variable
    message: `Your OTP verification code is ${token}`,
    numbers: [mobile],
  };

  try {
    // Send the message using Fast2SMS API
    const response = await fast2sms.sendMessage(options);
    console.log("OTP sent successfully:", response);  // Log full response from Fast2SMS
    return { success: true, message: "OTP sent successfully!", token }; // Return OTP with success message
  } catch (error) {
    console.error("Error details:", error.response ? error.response.data : error);
    return { success: false, message: "Failed to send OTP." };
  }
};

// Express Setup to handle POST requests for OTP sending and login
const app = express();
const port = 3000;

app.use(express.json());

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  const { mobileNumber } = req.body;

  // Check if mobile number is provided
  if (!mobileNumber) {
    return res.status(400).json({ success: false, message: "Mobile number is required." });
  }

  try {
    const result = await sendMessage(mobileNumber);
    if (result.success) {
      res.status(200).json(result); // Respond with OTP and success message
    } else {
      res.status(500).json(result); // Respond with failure message
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// POST endpoint for login
let storedOTP = '';  // This will store the OTP temporarily for verification

app.post('/verify-otp', (req, res) => {
  const { mobileNumber, otp } = req.body;

  // Validate OTP and proceed with login if it matches
  if (!otp || !mobileNumber) {
    return res.status(400).json({ success: false, message: "Mobile number and OTP are required." });
  }

  if (otp === storedOTP) {
    // Simulate login success
    res.status(200).json({ success: true, message: "Login successful!" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
