#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "esp_camera.h"

// ── WiFi & Backend Credentials ───────────────────────────────
#define WIFI_SSID "Giang Son"
#define WIFI_PASSWORD "giang1969"

// Backend info
const char* host = "fleet-tracker-nh01.onrender.com";
const int port = 443;
const char* url_path = "/api/tracking/verify";

#define DEVICE_API_KEY "fleet_tracker_device_api_key_2026"
#define DEVICE_ID "device_001"

// ── UART từ ESP32 ─────────────────────────────────────────────
#define UART_RX 14
#define UART_TX 15
#define UART_BAUD 9600

HardwareSerial espSerial(1);

// Cooldown chống Spam
unsigned long lastCaptureTime = 0;
const unsigned long COOLDOWN_MS = 5000; // Đợi 5s giữa 2 lần chụp

// ── Cấu hình Camera AI-Thinker ────────────────────────────────
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Giảm phân giải xuống VGA (640x480) để chống nghẽn mạng
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA; 
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAM] Init fail: 0x%x\n", err);
  } else {
    Serial.println("[CAM] Init OK (VGA)");
  }
}

// Hàm kiểm tra và tự động nối lại WiFi
void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("[WiFi] Reconnecting");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long start = millis();
    // Đợi tối đa 10s
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
      delay(500);
      Serial.print(".");
    }
    Serial.println();
    if(WiFi.status() == WL_CONNECTED) {
      Serial.println("[WiFi] Reconnected!");
    } else {
      Serial.println("[WiFi] Reconnect failed!");
    }
  }
}

// ── Gửi API (Dùng WiFiClientSecure thuần) ─────────────────────
void uploadPhoto(const char* fingerId) {
  checkWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[API] No WiFi. Abort.");
    return;
  }

  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) {
    Serial.println("[CAM] Capture failed!");
    return;
  }
  
  Serial.println("[API] Bắt đầu upload ảnh...");

  WiFiClientSecure client;
  client.setInsecure(); // HTTPS không cần check chứng chỉ
  client.setTimeout(10000); // 10s timeout

  if (!client.connect(host, port)) {
    Serial.println("[API] Connect to server failed!");
    esp_camera_fb_return(fb); // Nhớ trả RAM
    return;
  }

  String boundary = "----FleetTrackerBoundary123456";
  
  // 1. Build Header & Multipart Data
  String bodyStart = "--" + boundary + "\r\n";
  bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"photo.jpg\"\r\n";
  bodyStart += "Content-Type: image/jpeg\r\n\r\n";

  String bodyEnd = "\r\n--" + boundary + "\r\n";
  bodyEnd += "Content-Disposition: form-data; name=\"fingerprintId\"\r\n\r\n";
  bodyEnd += String(fingerId) + "\r\n";
  bodyEnd += "--" + boundary + "\r\n";
  bodyEnd += "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n";
  bodyEnd += String(DEVICE_ID) + "\r\n";
  bodyEnd += "--" + boundary + "--\r\n";

  uint32_t contentLength = bodyStart.length() + fb->len + bodyEnd.length();

  // 2. Gửi HTTP Request Headers
  client.print(String("POST ") + url_path + " HTTP/1.1\r\n");
  client.print(String("Host: ") + host + "\r\n");
  client.print(String("x-device-api-key: ") + DEVICE_API_KEY + "\r\n");
  client.print(String("Content-Type: multipart/form-data; boundary=") + boundary + "\r\n");
  client.print(String("Content-Length: ") + String(contentLength) + "\r\n");
  client.print("Connection: close\r\n\r\n");

  // 3. Gửi Body 
  client.print(bodyStart);
  
  // Gửi dữ liệu ảnh theo chunk 1024 bytes (Tối ưu RAM & Sửa lỗi chia hết cho 1024)
  size_t fbLen = fb->len;
  size_t bytesSent = 0;
  while (bytesSent < fbLen) {
    size_t chunkSize = fbLen - bytesSent;
    if (chunkSize > 1024) {
      chunkSize = 1024;
    }
    client.write(fb->buf + bytesSent, chunkSize);
    bytesSent += chunkSize;
  }
  
  client.print(bodyEnd);

  // 4. Đọc kết quả từ Server
  Serial.print("[API] Đang đợi phản hồi... ");
  while (client.connected() && !client.available()) {
    delay(10);
  }
  
  if (client.available()) {
    String responseLine = client.readStringUntil('\n');
    Serial.print("[API] Status: ");
    Serial.println(responseLine);
    
    // Bỏ qua HTTP Headers
    while (client.connected()) {
      String line = client.readStringUntil('\n');
      if (line == "\r" || line == "") break; 
    }
    
    // Đọc và in chi tiết lỗi JSON từ Server
    if (client.available()) {
      String body = client.readString();
      Serial.print("[API] Response: ");
      Serial.println(body);
    }
  } else {
    Serial.println("[API] No response");
  }

  client.stop();
  esp_camera_fb_return(fb); // Trả Frame Buffer cho hệ thống
  Serial.println("[API] Upload xong.");
}

// ── Setup & Loop ──────────────────────────────────────────────
void setup() {
  Serial.begin(115200); 
  espSerial.begin(UART_BAUD, SERIAL_8N1, UART_RX, UART_TX); 
  
  checkWiFi();
  setupCamera();
  Serial.println("[SYS] Đang lắng nghe ESP32 qua UART...");
}

void loop() {
  // Giữ mạng
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 10000) {
    checkWiFi();
    lastCheck = millis();
  }

  // Lắng nghe UART
  if (espSerial.available()) {
    char buffer[32];
    int len = espSerial.readBytesUntil('\n', buffer, sizeof(buffer) - 1);
    buffer[len] = '\0'; 
    
    // Bỏ ký tự '\r'
    if(len > 0 && buffer[len-1] == '\r') {
      buffer[len-1] = '\0';
    }

    if (strncmp(buffer, "ID:", 3) == 0) {
      char* idStr = buffer + 3;
      
      // Validate: Chỉ chứa số
      bool isNumber = true;
      for(int i = 0; i < strlen(idStr); i++) {
        if(!isdigit(idStr[i])) {
          isNumber = false;
          break;
        }
      }

      if (isNumber && strlen(idStr) > 0) {
        // Cooldown 5s chống Spam
        if (millis() - lastCaptureTime > COOLDOWN_MS || lastCaptureTime == 0) {
          lastCaptureTime = millis();
          Serial.print("[UART] Nhận ID hợp lệ: "); 
          Serial.println(idStr);
          uploadPhoto(idStr);
        } else {
          Serial.println("[UART] Đang cooldown... Bỏ qua ID này.");
        }
      } else {
        Serial.println("[UART] Lỗi! ID chứa ký tự lạ.");
      }
    }
  }
}
