const axios = require('axios');

const API_URL = 'http://localhost:3001/tracking/device';
const DEVICE_ID = 'GPS-V1-001'; // Ensure this exists in your DB for a vehicle
const API_KEY = 'test-api-key'; // Set this in your .env as DEVICE_API_KEY

async function sendGpsUpdate() {
  const payload = {
    deviceId: DEVICE_ID,
    latitude: 10.762622,
    longitude: 106.660172,
    speed: 55,
    heading: 90,
    apiKey: API_KEY
  };

  try {
    console.log(`Sending GPS update for ${DEVICE_ID}...`);
    const response = await axios.post(API_URL, payload);
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

sendGpsUpdate();
