# PushPulse - 10 Million Users Push Notification SaaS (FCM Topics Engine)

PushPulse is an enterprise-grade Push Notification SaaS designed for **10 MILLION+ users scalability** using **Firebase Cloud Messaging (FCM) Topics** rather than individual token loops. 

---

## ⚡ 10 Million Users Scalability Architecture

### 🛑 Why Individual Token Loops Fail at 10M Users:
- Multicast with tokens array (`sendEachForMulticast`) requires batching 20,000 requests of 500 tokens each.
- Incurs massive database read load (querying 10,000,000 rows), high memory usage, network timeouts, and takes hours.

### ✅ The Solution: FCM Topics (Zero Token Loop, Single API Call):
- When a user grants permission, their device token is registered directly into Google FCM Topics:
  1. `all_users`: Global broadcast topic for 10M+ users.
  2. `project_{projectId}`: Isolated topic for a YouTube channel or website (e.g. `project_ss-banna-jojawar`).
  3. `platform_{platform}`: Device topic (`platform_web`, `platform_android`, `platform_ios`).
- **Broadcasting is a SINGLE API CALL**:
  ```javascript
  // Sends to 10M+ users with zero server loops or DB reads!
  const response = await admin.messaging().send({
    topic: 'all_users', // or 'project_ss-banna-jojawar'
    notification: { title, body, imageUrl },
    data: { clickUrl, topic: 'all_users' }
  });
  ```
- **Google's worldwide edge CDN handles fan-out to 10,000,000+ devices in milliseconds.**
- Database (Firebase Firestore / local persistence) is used strictly for **analytics & counts**, completely decoupling the push broadcast from database operations.

---

## 📊 FCM Topics & Schema

### 1. FCM Topics Mapping
| Project / Scope | FCM Topic Name | Description |
|---|---|---|
| **Global 10M Users** | `all_users` | Reaches every subscriber across all channels & sites |
| **SS Banna Jojawar** | `project_ss-banna-jojawar` | Reaches only subscribers of the SS Banna Jojawar YouTube channel |
| **Main Website** | `project_main-website` | Reaches subscribers of the main website |
| **Custom Project** | `project_{projectId}` | Automatically created for any new project |
| **Platforms** | `platform_web`, `platform_android`, `platform_ios` | Device-specific conditional filters |

### 2. Topic Subscriber Count Analytics (`/api/topics`)
```json
{
  "success": true,
  "architecture": "FCM Topics (Zero Token Loop, 10M Scale)",
  "topics": [
    { "topic": "all_users", "subscriberCount": 1250001, "projectName": "All 10M+ Users (Global)" },
    { "topic": "project_ss-banna-jojawar", "subscriberCount": 850401, "projectName": "SS Banna Jojawar" },
    { "topic": "project_main-website", "subscriberCount": 399600, "projectName": "Main Portal Website" }
  ]
}
```

---

## 🚀 Quick Start & LaraPush Features

### Start Fullstack Server
```bash
node server/server.js
```

Application is live at:
- **Admin Dashboard**: [http://localhost:5000](http://localhost:5000)
- **Live Multi-OS Preview**: Windows, Android, macOS real-time toast simulators
- **WordPress Plugin (.zip)**: [http://localhost:5000/larapush-pulse-wp.zip](http://localhost:5000/larapush-pulse-wp.zip)
- **Multi-Project Client Demo**: [http://localhost:5000/demo](http://localhost:5000/demo)
- **Client Push SDK with Floating Bell**: [http://localhost:5000/push-sdk.js](http://localhost:5000/push-sdk.js)
- **Service Worker with CTR Tracking**: [http://localhost:5000/firebase-messaging-sw.js](http://localhost:5000/firebase-messaging-sw.js)
- **Automations & RSS-to-Push**: [http://localhost:5000/api/automations](http://localhost:5000/api/automations)

**Admin Credentials**: Username: `admin` | Password: `admin123`

---

## 🛠️ API Reference

### 1. Register Token to FCM Topics
`POST /api/save-token`
```json
{
  "token": "fcm_registration_token...",
  "projectId": "ss-banna-jojawar",
  "platform": "web"
}
```
*Subscribes token directly to `all_users` and `project_ss-banna-jojawar` on Google FCM.*

### 2. Single API Call Broadcast to 10M Users
`POST /api/send`
```json
{
  "title": "🚨 SS Banna Jojawar - New Video Live!",
  "body": "Watch the video premiere on YouTube now!",
  "clickUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "projectId": "ss-banna-jojawar", // or "all" for all_users
  "notificationType": "video"
}
```
*Executes `admin.messaging().send({ topic: 'project_ss-banna-jojawar' })` in a single request.*

### 3. Topic Counts & Analytics
`GET /api/topics`
*Returns subscriber count per topic.*

---

## 🌐 Client SDK Integration

```html
<!-- Tag subscribers directly into project topic -->
<script
  src="http://localhost:5000/push-sdk.js"
  data-project-id="ss-banna-jojawar"
  data-auto-prompt="true">
</script>
```

---

## 📄 License
MIT License.
