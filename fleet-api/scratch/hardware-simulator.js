/**
 * FleetTracker - Premium IoT Hardware Simulator
 * Simulates ESP32 / ESP32-CAM IoT devices mounted on vehicles.
 * Supports: GPS streaming, Route simulation, Biometric Enrollment, Deletion, and Verification (with simulated Camera upload).
 * 
 * Run using: node scratch/hardware-simulator.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Colors for terminal logs
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fgBlack: "\x1b[30m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgBlue: "\x1b[34m",
  fgMagenta: "\x1b[35m",
  fgCyan: "\x1b[36m",
  fgWhite: "\x1b[37m",
  
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

// Configurations
const BACKEND_URL = 'https://fleet-tracker-nh01.onrender.com/api';
const API_KEY = 'fleet_tracker_device_api_key_2026';
let deviceId = 'device_001';

// Predefined Route: PTIT to Nguyen Van Troi (Hanoi)
const ROUTE_PTIT_TO_NGUYEN_VAN_TROI = [
  { lat: 20.980636, lng: 105.787645 },
  { lat: 20.98046,  lng: 105.787805 },
  { lat: 20.980377, lng: 105.78787 },
  { lat: 20.979996, lng: 105.787401 },
  { lat: 20.979946, lng: 105.787339 },
  { lat: 20.979634, lng: 105.786954 },
  { lat: 20.97936,  lng: 105.786616 },
  { lat: 20.979326, lng: 105.786574 },
  { lat: 20.979192, lng: 105.786398 },
  { lat: 20.979189, lng: 105.786318 },
  { lat: 20.979189, lng: 105.78626 },
  { lat: 20.979201, lng: 105.786212 },
  { lat: 20.979224, lng: 105.786163 },
  { lat: 20.979274, lng: 105.786105 },
  { lat: 20.979306, lng: 105.786077 },
  { lat: 20.979661, lng: 105.785761 },
  { lat: 20.980581, lng: 105.784929 },
  { lat: 20.980879, lng: 105.784679 },
  { lat: 20.981551, lng: 105.784083 },
  { lat: 20.981756, lng: 105.7839 },
  { lat: 20.982167, lng: 105.783535 },
  { lat: 20.98231,  lng: 105.783409 },
  { lat: 20.982668, lng: 105.78309 },
  { lat: 20.982981, lng: 105.783264 },
  { lat: 20.983047, lng: 105.78329 },
  { lat: 20.983121, lng: 105.783356 },
  { lat: 20.983135, lng: 105.783401 },
  { lat: 20.983133, lng: 105.783458 },
  { lat: 20.983136, lng: 105.783555 },
  { lat: 20.983186, lng: 105.783613 }
];

// Predefined Route: Nguyen Van Troi to Tran Phu (Hanoi)
const ROUTE_NGUYEN_VAN_TROI_TO_TRAN_PHU = [
  { lat: 20.983186, lng: 105.783613 },
  { lat: 20.983197, lng: 105.783626 },
  { lat: 20.983335, lng: 105.783763 },
  { lat: 20.983488, lng: 105.783828 },
  { lat: 20.983908, lng: 105.784005 },
  { lat: 20.983934, lng: 105.784028 },
  { lat: 20.984047, lng: 105.783993 },
  { lat: 20.984138, lng: 105.783931 },
  { lat: 20.984303, lng: 105.783772 },
  { lat: 20.985047, lng: 105.784735 },
  { lat: 20.9854,   lng: 105.785126 },
  { lat: 20.984952, lng: 105.786383 },
  { lat: 20.984642, lng: 105.78695 },
  { lat: 20.984345, lng: 105.787463 },
  { lat: 20.983903, lng: 105.78799 },
  { lat: 20.98386,  lng: 105.788031 },
  { lat: 20.983677, lng: 105.788232 },
  { lat: 20.983463, lng: 105.788455 },
  { lat: 20.983429, lng: 105.78849 },
  { lat: 20.983392, lng: 105.788527 },
  { lat: 20.983187, lng: 105.788731 },
  { lat: 20.982846, lng: 105.789068 },
  { lat: 20.982561, lng: 105.789354 },
  { lat: 20.982484, lng: 105.789429 },
  { lat: 20.982075, lng: 105.789837 },
  { lat: 20.982012, lng: 105.789899 },
  { lat: 20.981824, lng: 105.789659 },
  { lat: 20.981723, lng: 105.78953 },
  { lat: 20.981687, lng: 105.789486 },
  { lat: 20.981351, lng: 105.789072 },
  { lat: 20.980854, lng: 105.788459 },
  { lat: 20.980719, lng: 105.788292 },
  { lat: 20.980586, lng: 105.788128 },
  { lat: 20.980377, lng: 105.78787 },
  { lat: 20.98046,  lng: 105.787805 },
  { lat: 20.980636, lng: 105.787645 }
];
let currentRouteIndex = 0;
let activeRoutePoints = null;
let activeRouteName = '';
let usePredefinedRoute = false;

// Initial coordinates (HCM City center)
let gpsState = {
  latitude: 10.762622,
  longitude: 106.660172,
  speed: 80, // km/h (doubled from 40)
  heading: 90, // East
  isActive: false,
  intervalId: null
};

// Create a small mock image for camera verification uploads
const POSSIBLE_MOCK_FILES = [
  path.join(process.cwd(), 'mock-face.jpg'),
  path.join(process.cwd(), 'mock-face.jpeg'),
  path.join(__dirname, 'mock-face.jpg'),
  path.join(__dirname, 'mock-face.jpeg')
];

let mockImagePath = '';
for (const filePath of POSSIBLE_MOCK_FILES) {
  if (fs.existsSync(filePath)) {
    mockImagePath = filePath;
    break;
  }
}

if (!mockImagePath) {
  // If not found in either, create in process.cwd() for easy user replacement
  mockImagePath = path.join(process.cwd(), 'mock-face.jpg');
}
const MOCK_IMAGE_PATH = mockImagePath;

function ensureMockImageExists() {
  if (!fs.existsSync(MOCK_IMAGE_PATH)) {
    // Generate a tiny valid 1x1 pixel JPEG/PNG or just dummy bytes
    const dummyJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
      0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
      0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
      0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0x37, 0xff, 0xd9
    ]);
    fs.writeFileSync(MOCK_IMAGE_PATH, dummyJpeg);
  }
}

// Readline setup for CLI Menu
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function clearScreen() {
  process.stdout.write('\x1Bc');
}

// Print beautifully styled header
function printHeader() {
  log(colors.fgCyan + colors.bright, "========================================================");
  log(colors.fgCyan + colors.bright, "   🚀 FLEETTRACKER - PREMIUM IOT HARDWARE SIMULATOR     ");
  log(colors.fgCyan + colors.bright, "========================================================");
  log(colors.fgWhite, `📡 Target Server  : ${colors.fgYellow}${BACKEND_URL}`);
  log(colors.fgWhite, `🔑 Device API Key : ${colors.fgYellow}${API_KEY}`);
  log(colors.fgWhite, `🚗 Current Device : ${colors.fgYellow}${deviceId} (Vehicle slot)`);
  log(colors.fgWhite, `🗺️ Active Route   : ${colors.fgYellow}${usePredefinedRoute ? activeRouteName : "HCM Center (Random)"}`);
  log(colors.fgWhite, `📍 Location Status: ${colors.fgYellow}${gpsState.latitude.toFixed(6)}, ${gpsState.longitude.toFixed(6)} (Speed: ${gpsState.speed} km/h)`);
  log(colors.fgWhite, `🔄 Streaming GPS  : ${gpsState.isActive ? colors.fgGreen + "● ACTIVE (5s interval)" : colors.fgRed + "○ INACTIVE"}`);
  log(colors.fgCyan + colors.bright, "========================================================");
}

// Interactive prompt
function promptMenu() {
  printHeader();
  console.log(`\n${colors.bright}Choose an action:${colors.reset}`);
  console.log(`  ${colors.fgGreen}1.${colors.reset} Toggle GPS & IoT Polling streaming`);
  console.log(`  ${colors.fgGreen}2.${colors.reset} Trigger Biometric Verification (Scan Fingerprint & Face at vehicle)`);
  console.log(`  ${colors.fgGreen}3.${colors.reset} Change simulated deviceId`);
  console.log(`  ${colors.fgGreen}4.${colors.reset} Reset GPS location to HCM Center`);
  console.log(`  ${colors.fgGreen}5.${colors.reset} Force Fingerprint Enrollment (Direct link to Driver DB)`);
  console.log(`  ${colors.fgGreen}6.${colors.reset} Select PTIT to Nguyen Van Troi Route (Hanoi)`);
  console.log(`  ${colors.fgGreen}7.${colors.reset} Select Nguyen Van Troi to Tran Phu Route (Hanoi)`);
  console.log(`  ${colors.fgGreen}8.${colors.reset} Exit`);
  
  rl.question(`\n${colors.fgCyan}${colors.bright}Enter option [1-8]: ${colors.reset}`, handleMenuSelection);
}

// Handle action selection
async function handleMenuSelection(option) {
  switch (option.trim()) {
    case '1':
      toggleGpsStreaming();
      break;
    case '2':
      await triggerBiometricVerification();
      break;
    case '3':
      changeDeviceId();
      break;
    case '4':
      resetGpsLocation();
      break;
    case '5':
      await forceFingerprintEnrollment();
      break;
    case '6':
      selectHanoiRoute1();
      break;
    case '7':
      selectHanoiRoute2();
      break;
    case '8':
      log(colors.fgYellow, "\nStopping simulator. Goodbye! 👋");
      if (gpsState.intervalId) clearInterval(gpsState.intervalId);
      rl.close();
      process.exit(0);
    default:
      log(colors.fgRed, "\nInvalid option, please choose between 1 and 8.");
      setTimeout(promptMenu, 1500);
      break;
  }
}

// 1. Toggle GPS & Polling Streaming
function toggleGpsStreaming() {
  if (gpsState.isActive) {
    clearInterval(gpsState.intervalId);
    gpsState.intervalId = null;
    gpsState.isActive = false;
    log(colors.fgYellow, "\n🛑 GPS Streaming & IoT Polling stopped.");
    setTimeout(promptMenu, 1500);
  } else {
    gpsState.isActive = true;
    log(colors.fgGreen, "\n🚀 GPS Streaming & IoT Polling started! Sending updates every 5 seconds...");
    
    // Send immediate first tick
    sendGpsTick();
    
    gpsState.intervalId = setInterval(() => {
      if (usePredefinedRoute && activeRoutePoints) {
        if (currentRouteIndex < activeRoutePoints.length) {
          const pt = activeRoutePoints[currentRouteIndex];
          gpsState.latitude = pt.lat;
          gpsState.longitude = pt.lng;
          
          if (currentRouteIndex < activeRoutePoints.length - 1) {
            const nextPt = activeRoutePoints[currentRouteIndex + 1];
            const dy = nextPt.lat - pt.lat;
            const dx = nextPt.lng - pt.lng;
            gpsState.heading = Math.floor((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360);
          }
          currentRouteIndex++;
        } else {
          currentRouteIndex = 0;
          const pt = activeRoutePoints[currentRouteIndex];
          gpsState.latitude = pt.lat;
          gpsState.longitude = pt.lng;
          currentRouteIndex++;
        }
      } else {
        // Simulate movement: vehicle moves slightly North-East (doubled increments)
        gpsState.latitude += 0.00030 * (Math.random() * 0.4 + 0.8);
        gpsState.longitude += 0.00044 * (Math.random() * 0.4 + 0.8);
        gpsState.heading = (gpsState.heading + Math.floor(Math.random() * 20 - 10) + 360) % 360;
      }
      
      sendGpsTick();
    }, 5000);
    
    setTimeout(promptMenu, 1500);
  }
}

// API Call: Polling device status (GPS update & Check for remote actions)
async function sendGpsTick() {
  const url = `${BACKEND_URL}/tracking/device`;
  const payload = {
    deviceId: deviceId,
    latitude: gpsState.latitude,
    longitude: gpsState.longitude,
    speed: gpsState.speed,
    heading: gpsState.heading,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log(`\n${colors.fgRed}❌ GPS Tick failed: ${response.status} - ${errText}${colors.reset}`);
      return;
    }

    const data = await response.json();
    
    // Output small tick in console
    process.stdout.write(`${colors.fgGreen}✔ GPS Tick: [Lat: ${gpsState.latitude.toFixed(6)}, Lng: ${gpsState.longitude.toFixed(6)}]${colors.reset}`);
    
    // Check if server returned dynamic actions to perform
    if (data.action) {
      console.log(`\n${colors.fgMagenta}${colors.bright}🔔 RECEIVED IOT COMMAND FROM BACKEND: [${data.action.toUpperCase()}]${colors.reset}`);
      await handleBackendCommand(data);
    } else {
      process.stdout.write(' - Standing by...\n');
    }
  } catch (error) {
    console.log(`\n${colors.fgRed}❌ GPS Polling Connection Error: ${error.message}${colors.reset}`);
  }
}

// Handle IoT hardware commands returned from Backend Polling
async function handleBackendCommand(command) {
  const { action, enrollId, deleteId } = command;

  if (action === 'enroll') {
    log(colors.fgYellow, `\n👤 Simulating fingerprint enrollment on device... Place finger on AS608 sensor.`);
    log(colors.fgYellow, `⏳ Processing slot #${enrollId} (Scanning 3 steps)...`);
    
    // Mock hardware scanning delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    log(colors.fgGreen, `✔ Scan complete. Transmitting enrollment result to Server...`);
    
    // Post result back
    try {
      const response = await fetch(`${BACKEND_URL}/tracking/device/enroll-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-api-key': API_KEY
        },
        body: JSON.stringify({
          deviceId,
          fingerprintId: enrollId,
          success: true
        })
      });
      
      if (response.ok) {
        log(colors.fgGreen, `🎉 Fingerprint slot #${enrollId} successfully enrolled & linked to Driver on Server!\n`);
      } else {
        const err = await response.text();
        log(colors.fgRed, `❌ Failed to submit enroll result: ${err}`);
      }
    } catch (e) {
      log(colors.fgRed, `❌ Connection error sending enroll result: ${e.message}`);
    }
  } 
  
  else if (action === 'delete') {
    log(colors.fgYellow, `\n🛡️ Simulating fingerprint deletion from hardware memory...`);
    log(colors.fgYellow, `⏳ Clearing slot #${deleteId}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const response = await fetch(`${BACKEND_URL}/tracking/device/delete-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-api-key': API_KEY
        },
        body: JSON.stringify({
          deviceId,
          fingerprintId: deleteId,
          success: true
        })
      });
      
      if (response.ok) {
        log(colors.fgGreen, `✔ Fingerprint slot #${deleteId} cleared successfully from hardware & database updated!\n`);
      } else {
        log(colors.fgRed, `❌ Failed to submit delete result.`);
      }
    } catch (e) {
      log(colors.fgRed, `❌ Connection error sending delete result: ${e.message}`);
    }
  } 
  
  else if (action === 'clear_all') {
    log(colors.fgYellow, `\n🧹 Simulating FULL FLASH ERASE on biometric sensor...`);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      const response = await fetch(`${BACKEND_URL}/tracking/device/clear-all-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-api-key': API_KEY
        },
        body: JSON.stringify({
          deviceId,
          success: true
        })
      });
      
      if (response.ok) {
        log(colors.fgGreen, `✔ All fingerprints cleared successfully from vehicle ${deviceId} hardware memory!\n`);
      } else {
        log(colors.fgRed, `❌ Failed to submit clear-all result.`);
      }
    } catch (e) {
      log(colors.fgRed, `❌ Connection error sending clear-all result: ${e.message}`);
    }
  }
}

// 2. Trigger Biometric Verification (Scan Fingerprint & Face at vehicle)
async function triggerBiometricVerification() {
  log(colors.fgCyan, "\n--- BIOMETRIC VERIFICATION SIMULATOR ---");
  
  rl.question(`🔑 Enter Fingerprint Slot ID matched (1-127, default: 1): `, async (fpId) => {
    const fingerprintId = parseInt(fpId.trim() || '1', 10);
    if (isNaN(fingerprintId) || fingerprintId < 1 || fingerprintId > 127) {
      log(colors.fgRed, "Invalid Fingerprint Slot ID! Must be between 1 and 127.");
      setTimeout(promptMenu, 1500);
      return;
    }
    
    log(colors.fgYellow, `⏳ Simulating camera capture & fingerprint match on vehicle...`);
    ensureMockImageExists();
    
    try {
      // Construct multipart/form-data upload using standard Node fetch FormData
      const formData = new FormData();
      formData.append('deviceId', deviceId);
      formData.append('fingerprintId', fingerprintId.toString());
      
      // Load real image file bytes into form-data Blob
      const fileBuffer = fs.readFileSync(MOCK_IMAGE_PATH);
      const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
      const uploadFilename = MOCK_IMAGE_PATH.endsWith('.jpeg') ? 'face_capture.jpeg' : 'face_capture.jpg';
      formData.append('image', blob, uploadFilename);
      
      log(colors.fgYellow, `📡 Uploading verification payload to server /tracking/verify...`);
      
      const response = await fetch(`${BACKEND_URL}/tracking/verify`, {
        method: 'POST',
        headers: {
          'x-device-api-key': API_KEY
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        log(colors.fgGreen, `\n🎉 VERIFICATION SUCCESSFUL!`);
        console.log(JSON.stringify(result, null, 2));
      } else {
        log(colors.fgRed, `\n❌ VERIFICATION FAILED: [${response.status}]`);
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (e) {
      log(colors.fgRed, `❌ Connection error during biometric verification: ${e.message}`);
    }
    
    rl.question(`\nPress Enter to return to main menu...`, () => promptMenu());
  });
}

// 3. Change simulated deviceId
function changeDeviceId() {
  rl.question(`\n🚗 Enter new deviceId (current: ${deviceId}): `, (newId) => {
    if (newId.trim()) {
      deviceId = newId.trim();
      log(colors.fgGreen, `✔ Device ID changed to: ${deviceId}`);
    } else {
      log(colors.fgYellow, "Device ID remained unchanged.");
    }
    setTimeout(promptMenu, 1500);
  });
}

// 4. Reset GPS location to HCM Center
function resetGpsLocation() {
  usePredefinedRoute = false;
  activeRoutePoints = null;
  activeRouteName = '';
  gpsState.latitude = 10.762622;
  gpsState.longitude = 106.660172;
  gpsState.speed = 40;
  gpsState.heading = 90;
  log(colors.fgGreen, "\n📍 Location coordinates reset to HCM Center (Quận 10).");
  setTimeout(promptMenu, 1500);
}

// 6. Select PTIT to Nguyen Van Troi Route (Hanoi)
function selectHanoiRoute1() {
  usePredefinedRoute = true;
  activeRoutePoints = ROUTE_PTIT_TO_NGUYEN_VAN_TROI;
  activeRouteName = "PTIT -> Nguyen Van Troi (Hanoi)";
  currentRouteIndex = 0;
  
  // Set initial coordinate to start of route
  const startPt = activeRoutePoints[0];
  gpsState.latitude = startPt.lat;
  gpsState.longitude = startPt.lng;
  gpsState.speed = 40; // normal speed
  
  if (activeRoutePoints.length > 1) {
    const nextPt = activeRoutePoints[1];
    const dy = nextPt.lat - startPt.lat;
    const dx = nextPt.lng - startPt.lng;
    gpsState.heading = Math.floor((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360);
  }
  
  log(colors.fgGreen, "\n📍 Selected Route: PTIT (Gate) -> Phố Nguyễn Văn Trỗi (Hà Đông).");
  log(colors.fgGreen, `📍 Starting point coordinates: ${startPt.lat}, ${startPt.lng}`);
  
  setTimeout(promptMenu, 2000);
}

// 7. Select Nguyen Van Troi to Tran Phu Route (Hanoi)
function selectHanoiRoute2() {
  usePredefinedRoute = true;
  activeRoutePoints = ROUTE_NGUYEN_VAN_TROI_TO_TRAN_PHU;
  activeRouteName = "Nguyen Van Troi -> Tran Phu (Hanoi)";
  currentRouteIndex = 0;
  
  // Set initial coordinate to start of route
  const startPt = activeRoutePoints[0];
  gpsState.latitude = startPt.lat;
  gpsState.longitude = startPt.lng;
  gpsState.speed = 40; // normal speed
  
  if (activeRoutePoints.length > 1) {
    const nextPt = activeRoutePoints[1];
    const dy = nextPt.lat - startPt.lat;
    const dx = nextPt.lng - startPt.lng;
    gpsState.heading = Math.floor((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360);
  }
  
  log(colors.fgGreen, "\n📍 Selected Route: Phố Nguyễn Văn Trỗi -> Đường Trần Phú (Mộ Lao).");
  log(colors.fgGreen, `📍 Starting point coordinates: ${startPt.lat}, ${startPt.lng}`);
  
  setTimeout(promptMenu, 2000);
}

// 5. Force Fingerprint Enrollment (Direct link to Driver DB)
async function forceFingerprintEnrollment() {
  log(colors.fgCyan, "\n--- FORCE FINGERPRINT ENROLLMENT ---");
  
  rl.question(`👤 Enter Fingerprint ID to register (1-127, default: 1): `, async (fpId) => {
    const fingerprintId = parseInt(fpId.trim() || '1', 10);
    if (isNaN(fingerprintId) || fingerprintId < 1 || fingerprintId > 127) {
      log(colors.fgRed, "Invalid Fingerprint ID! Must be between 1 and 127.");
      setTimeout(promptMenu, 1500);
      return;
    }
    
    log(colors.fgYellow, `⏳ Sending force enrollment result for device ${deviceId}, slot #${fingerprintId}...`);
    
    try {
      const response = await fetch(`${BACKEND_URL}/tracking/device/enroll-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-api-key': API_KEY
        },
        body: JSON.stringify({
          deviceId,
          fingerprintId,
          success: true
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        log(colors.fgGreen, `\n🎉 ENROLLMENT SUCCESSFUL!`);
        console.log(JSON.stringify(result, null, 2));
      } else {
        log(colors.fgRed, `\n❌ ENROLLMENT FAILED: [${response.status}]`);
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (e) {
      log(colors.fgRed, `❌ Connection error during force enrollment: ${e.message}`);
    }
    
    rl.question(`\nPress Enter to return to main menu...`, () => promptMenu());
  });
}

// Start Simulator
clearScreen();
ensureMockImageExists();
promptMenu();
