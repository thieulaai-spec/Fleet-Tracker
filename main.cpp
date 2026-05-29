#include <Adafruit_Fingerprint.h>
#include <Arduino.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <SoftwareSerial.h>

// ── WiFi & Backend Credentials ───────────────────────────────
#define WIFI_SSID "Giang Son"
#define WIFI_PASSWORD "giang1969"

#define BACKEND_URL                                                            \
  "https://fleet-tracker-nh01.onrender.com/api/tracking/device" // TODO: Đổi
                                                                // thành IP LAN
                                                                // hoặc Domain
                                                                // của NestJS
                                                                // Backend
#define DEVICE_API_KEY                                                         \
  "fleet_tracker_device_api_key_2026" // TODO: Khớp với biến môi trường
                                      // DEVICE_API_KEY trong file .env của
                                      // NestJS
#define DEVICE_ID                                                              \
  "device_001" // TODO: Nhập mã thiết bị (deviceId) của xe tương ứng trong
               // database

// ── AS608 Fingerprint ────────────────────────────────────────
// AS608 TX → ESP32 GPIO 32 (RX)
// AS608 RX → ESP32 GPIO 33 (TX)
#define FINGER_RX 32
#define FINGER_TX 33
#define FINGER_BAUD 57600

HardwareSerial fingerSerial(1);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

// ── GPS NEO-6M ────────────────────────────────────────────────
// NEO-6M TX → ESP32 GPIO 18 (RX)
// NEO-6M RX → ESP32 GPIO 19 (TX)
#define GPS_RX 18
#define GPS_TX 19
#define GPS_BAUD 9600

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

// ── ESP-CAM UART (SoftwareSerial) ─────────────────────────────
#define CAM_RX 26
#define CAM_TX 25
#define CAM_BAUD 9600 // Dùng 9600 để SoftwareSerial ổn định
SoftwareSerial camSerial(CAM_RX, CAM_TX);

// ── Firebase Objects ──────────────────────────────────────────
// ── Globals ───────────────────────────────────────────────────
unsigned long lastSendMs = 0;
#define SEND_INTERVAL_MS 1000 // Gửi định kỳ mỗi 1 giây (Cực mượt!)
int lastFingerprintId = 0;    // ID vân tay gần nhất

// ── Forward declarations ──────────────────────────────────────
void displayGpsInfo();
int getFingerprintID();
uint8_t enrollFingerprint(uint16_t id);
void sendDataToBackend(double lat, double lng, int fingerId, int sats);
void sendEnrollResult(int enrollId, bool success);

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // 1. Kết nối WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(F("[WiFi] Dang ket noi"));
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(F("."));
    delay(500);
  }
  Serial.println();
  Serial.print(F("[WiFi] Da ket noi! IP: "));
  Serial.println(WiFi.localIP());

  // Gửi thử 1 gói dữ liệu test kết nối lên Backend
  Serial.println(F("[Backend] Dang gui test ket noi..."));
  sendDataToBackend(0.0, 0.0, 0, 0);

  // GPS
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX, GPS_TX);

  // Fingerprint — serial MUST open before finger.begin()
  fingerSerial.begin(FINGER_BAUD, SERIAL_8N1, FINGER_RX, FINGER_TX);
  finger.begin(FINGER_BAUD);

  if (finger.verifyPassword()) {
    Serial.println(F("[FP] AS608 OK"));
  } else {
    Serial.println(F("[FP] AS608 NOT FOUND — check wiring"));
  }

  // Khởi tạo UART cho ESP-CAM
  camSerial.begin(CAM_BAUD);

  Serial.println(F("[GPS] Listening..."));
}

// ── Loop ──────────────────────────────────────────────────────
void loop() {
  // Check for serial command to enroll new fingerprint
  if (Serial.available() > 0) {
    int id = Serial.parseInt();
    if (id > 0 && id <= 127) {
      // Clear serial buffer
      while (Serial.available() > 0)
        Serial.read();
      enrollFingerprint(id);
    } else if (id > 127) {
      Serial.println(F("[Enroll] ID phai tu 1 den 127!"));
      while (Serial.available() > 0)
        Serial.read();
    }
  }

  // Kiểm tra quét vân tay
  int currentFingerId = getFingerprintID();
  if (currentFingerId > 0) {
    lastFingerprintId = currentFingerId;
    Serial.print(F("[FP] Match ID #"));
    Serial.print(currentFingerId);
    Serial.println(F("! Gui UART cho ESP-CAM..."));
    
    // Gửi ID qua UART cho ESP-CAM (vd: "ID:12\n")
    camSerial.print("ID:");
    camSerial.println(currentFingerId);
    
    Serial.println(F("Gui Supabase..."));
    // Gửi ngay lập tức khi phát hiện vân tay hợp lệ
    double lat = gps.location.isValid() ? gps.location.lat() : 0.0;
    double lng = gps.location.isValid() ? gps.location.lng() : 0.0;
    sendDataToBackend(lat, lng, currentFingerId,
                      gps.satellites.isValid() ? gps.satellites.value() : 0);
  }

  // Đọc dữ liệu GPS (Đọc im lặng không in)
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Gửi dữ liệu định kỳ mỗi 1 giây (nếu chưa có GPS sẽ gửi 0.0, 0.0 để test)
  if (millis() - lastSendMs > SEND_INTERVAL_MS) {
    lastSendMs = millis();

    // In thông tin GPS ra Serial (Chỉ 1 lần mỗi giây!)
    displayGpsInfo();

    double lat = gps.location.isValid() ? gps.location.lat() : 0.0;
    double lng = gps.location.isValid() ? gps.location.lng() : 0.0;
    int sats = gps.satellites.isValid() ? gps.satellites.value() : 0;

    sendDataToBackend(lat, lng, lastFingerprintId, sats);

    // Reset ID vân tay sau khi đã gửi đi
    lastFingerprintId = 0;
  }

  // Warn if no GPS data after 5 s
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    static unsigned long lastWarnMs = 0;
    if (millis() - lastWarnMs > 10000) {
      Serial.println(F("[GPS] No data — check wiring"));
      lastWarnMs = millis();
    }
  }
}

// ── GPS display ───────────────────────────────────────────────
void displayGpsInfo() {
  Serial.print(F("Sats: "));
  if (gps.satellites.isValid()) {
    Serial.print(gps.satellites.value());
  } else {
    Serial.print(F("0"));
  }

  Serial.print(F("  Location: "));
  if (gps.location.isValid()) {
    Serial.print(gps.location.lat(), 6);
    Serial.print(F(","));
    Serial.print(gps.location.lng(), 6);
  } else {
    Serial.print(F("INVALID"));
  }

  Serial.print(F("  Date/Time: "));
  if (gps.date.isValid()) {
    Serial.print(gps.date.month());
    Serial.print(F("/"));
    Serial.print(gps.date.day());
    Serial.print(F("/"));
    Serial.print(gps.date.year());
  } else {
    Serial.print(F("INVALID"));
  }

  Serial.print(F(" "));
  if (gps.time.isValid()) {
    if (gps.time.hour() < 10)
      Serial.print(F("0"));
    Serial.print(gps.time.hour());
    Serial.print(F(":"));
    if (gps.time.minute() < 10)
      Serial.print(F("0"));
    Serial.print(gps.time.minute());
    Serial.print(F(":"));
    if (gps.time.second() < 10)
      Serial.print(F("0"));
    Serial.print(gps.time.second());
    Serial.print(F("."));
    if (gps.time.centisecond() < 10)
      Serial.print(F("0"));
    Serial.print(gps.time.centisecond());
  } else {
    Serial.print(F("INVALID"));
  }

  Serial.println();
}

// ── Fingerprint verify ────────────────────────────────────────
int getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p == FINGERPRINT_NOFINGER)
    return 0; // no finger on sensor
  if (p != FINGERPRINT_OK)
    return -1;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK)
    return -1;

  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK)
    return -1;

  Serial.print(F("[FP] Match ID #"));
  Serial.print(finger.fingerID);
  Serial.print(F(" confidence "));
  Serial.println(finger.confidence);
  return finger.fingerID;
}

// ── Fingerprint enroll ────────────────────────────────────────
uint8_t enrollFingerprint(uint16_t id) {
  int p = -1;
  Serial.print(F("[Enroll] Dat ngon tay vao cam bien de dang ky ID #"));
  Serial.println(id);
  Serial.println(F("[Enroll] Gui bat ky ky tu nao qua Serial de HUY"));

  // Phase 1: First image scan
  while (p != FINGERPRINT_OK) {
    if (Serial.available() > 0) {
      Serial.println(F("[Enroll] Da HUY dang ky!"));
      while (Serial.available() > 0)
        Serial.read();
      return -1;
    }
    p = finger.getImage();
    if (p == FINGERPRINT_OK) {
      Serial.println(F("[Enroll] Da chup anh lan 1"));
    } else if (p != FINGERPRINT_NOFINGER) {
      Serial.println(F("[Enroll] Loi chup anh"));
    }
    delay(50);
  }

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println(F("[Enroll] Loi convert anh lan 1"));
    return p;
  }

  Serial.println(F("[Enroll] Nhac ngon tay ra..."));
  delay(2000);
  p = 0;
  while (p != FINGERPRINT_NOFINGER) {
    if (Serial.available() > 0) {
      Serial.println(F("[Enroll] Da HUY dang ky!"));
      while (Serial.available() > 0)
        Serial.read();
      return -1;
    }
    p = finger.getImage();
    delay(50);
  }

  // Phase 2: Second image scan (verification)
  Serial.print(F("[Enroll] Dat lai ngon tay de xac nhan ID #"));
  Serial.println(id);
  p = -1;
  while (p != FINGERPRINT_OK) {
    if (Serial.available() > 0) {
      Serial.println(F("[Enroll] Da HUY dang ky!"));
      while (Serial.available() > 0)
        Serial.read();
      return -1;
    }
    p = finger.getImage();
    if (p == FINGERPRINT_OK) {
      Serial.println(F("[Enroll] Da chup anh lan 2"));
    } else if (p != FINGERPRINT_NOFINGER) {
      Serial.println(F("[Enroll] Loi chup anh lan 2"));
    }
    delay(50);
  }

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println(F("[Enroll] Loi convert anh lan 2"));
    return p;
  }

  // Phase 3: Create model and store
  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    Serial.println(F("[Enroll] Van tay khong khop!"));
    return p;
  }

  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    Serial.print(F("[Enroll] THANH CONG! Da luu vao ID #"));
    Serial.println(id);
  } else {
    Serial.println(F("[Enroll] Loi luu tru vao bo nho"));
  }
  return p;
}

// ── Backend send ─────────────────────────────────────────────
void sendDataToBackend(double lat, double lng, int fingerId, int sats) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(BACKEND_URL);

    // Cài đặt Headers bắt buộc cho API NestJS
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-api-key", DEVICE_API_KEY);

    // Đọc thêm tốc độ và góc hướng đi (heading) từ GPS
    double speed = gps.speed.isValid() ? gps.speed.kmph() : 0.0;
    double heading = gps.course.isValid() ? gps.course.deg() : 0.0;

    // Tạo chuỗi JSON theo DeviceGpsUpdateDto
    char payload[250];
    snprintf(payload, sizeof(payload),
             "{\"deviceId\":\"%s\",\"latitude\":%.6f,\"longitude\":%.6f,"
             "\"speed\":%.2f,\"heading\":%.2f}",
             DEVICE_ID, lat, lng, speed, heading);

    Serial.print(F("[Backend] Sending data... "));
    int httpResponseCode = http.POST((uint8_t *)payload, strlen(payload));

    if (httpResponseCode >= 200 && httpResponseCode < 300) {
      Serial.println(F("SUCCESS!"));
      String response = http.getString();
      
      // Parse remote fingerprint enrollment command
      // Example response format: {"status":"ok","action":"enroll","enrollId":5}
      if (response.indexOf("\"action\":\"enroll\"") != -1) {
        int idIdx = response.indexOf("\"enrollId\":");
        if (idIdx != -1) {
          String idStr = "";
          for (int i = idIdx + 11; i < response.length(); i++) {
            char c = response.charAt(i);
            if (isdigit(c)) {
              idStr += c;
            } else if (c == '}' || c == ',') {
              break;
            }
          }
          int enrollId = idStr.toInt();
          if (enrollId > 0 && enrollId <= 127) {
            Serial.printf("[Remote] Nhận lệnh đăng ký vân tay ID: %d\n", enrollId);
            
            // Run enrollment
            uint8_t res = enrollFingerprint(enrollId);
            bool success = (res == FINGERPRINT_OK);
            
            // Send back result to server
            sendEnrollResult(enrollId, success);
          }
        }
      }
    } else {
      Serial.print(F("FAILED: "));
      if (httpResponseCode > 0) {
        Serial.println(httpResponseCode);
        String response = http.getString();
        Serial.println(response);
      } else {
        Serial.println(http.errorToString(httpResponseCode).c_str());
      }
    }

    http.end();
  } else {
    Serial.println(F("[Backend] LỖI: Mất kết nối WiFi!"));
  }
}

void sendEnrollResult(int enrollId, bool success) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = BACKEND_URL;
    url.replace("/device", "/device/enroll-result");
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-api-key", DEVICE_API_KEY);
    
    char payload[150];
    snprintf(payload, sizeof(payload),
             "{\"deviceId\":\"%s\",\"fingerprintId\":%d,\"success\":%s}",
             DEVICE_ID, enrollId, success ? "true" : "false");
             
    Serial.printf("[Backend] Gửi kết quả Remote Enroll: %s\n", payload);
    int httpResponseCode = http.POST((uint8_t *)payload, strlen(payload));
    
    if (httpResponseCode >= 200 && httpResponseCode < 300) {
      Serial.println(F("[Backend] Gửi kết quả Remote Enroll THÀNH CÔNG!"));
    } else {
      Serial.printf("[Backend] Gửi kết quả Remote Enroll THẤT BẠI: %d\n", httpResponseCode);
    }
    http.end();
  }
}