# 👥 ACTORS & ACTIONS - Quick Reference

## 🎭 ACTORS

| Actor | Type | Description | Authentication Required |
|-------|------|-------------|-------------------------|
| **Authenticated User** | Primary | Registered user with JWT token | ✅ Yes |
| **Anonymous User** | Secondary | Guest visitor without account | ❌ No |
| **System** | Automated | Background processes and calculations | N/A |
| **AI Service** | External | Python FastAPI + Ollama Llama3 | N/A |
| **WebSocket Gateway** | Infrastructure | Real-time event broadcaster | N/A |
| **Cloudinary** | External | Image storage service | N/A |

---

## 🎬 ACTIONS BY ACTOR

### 1️⃣ Authenticated User

#### 🔐 Authentication Actions
| Action | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Register | `/auth/register` | POST | Create new account with email/password |
| Login | `/auth/login` | POST | Authenticate and receive JWT token |

#### 🚨 Alert Management Actions
| Action | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Create Alert | `/alerts` | POST | Report road incident with location, type, photo |
| View All Alerts | `/alerts` | GET | See all public alerts |
| View Alert Details | `/alerts/:id` | GET | Get specific alert information |
| Filter by Distance | `/alerts?lat=X&lon=Y&distanceKm=Z` | GET | Get alerts within X km of location |
| Filter by User | `/alerts?userId=X` | GET | Get all alerts created by user |
| Confirm Alert | `/alerts/:id/confirm` | POST | Vote that alert is legitimate (+trust) |
| Deny Alert | `/alerts/:id/deny` | POST | Vote that alert is false (-1 confidence) |
| Delete Alert | `/alerts/:id` | DELETE | Remove own alert (+ delete image) |

#### 🤖 AI Assistant Actions
| Action | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Ask AI Question | `/ai/ask` | POST | Chat with vehicle assistance bot |

#### 👤 Profile Actions
| Action | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| View User Profile | `/users/:id` | GET | Get user data including trust score |

---

### 2️⃣ Anonymous User

| Action | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| View All Alerts | `/alerts` | GET | Browse public alerts |
| Filter by Distance | `/alerts?lat=X&lon=Y&distanceKm=Z` | GET | See nearby alerts |
| View Alert Details | `/alerts/:id` | GET | See specific alert |
| Connect WebSocket | `ws://backend` | WS | Receive real-time updates |

---

### 3️⃣ System (Automated)

#### Trust & Verification
| Action | Trigger | Description |
|--------|---------|-------------|
| Calculate Confidence Score | After vote | `SUM(confirming users' trust scores) - denials` |
| Update Alert Status → VERIFIED | When confirmations ≥ 3 | Mark alert as legitimate |
| Update Alert Status → REJECTED | When confidence ≤ -3 | Mark alert as false |
| Update Alert Status → EXPIRED | After 1 hour | Mark alert as outdated |
| Update Creator Trust Score | Alert becomes VERIFIED | Increase by +0.1 (max 5.0) |
| Update Creator Trust Score | Alert becomes REJECTED | Decrease by -0.2 (min 0.1) |

#### Data Processing
| Action | Trigger | Description |
|--------|---------|-------------|
| Detect Duplicate Alerts | Before creation | Same type, <100m, <10min → merge |
| Validate Coordinates | On create/update | Ensure lat/lon are valid |
| Sanitize Alert Data | Before storage/emit | Clean and validate data structure |
| Calculate Distance | For filtering | Haversine formula (lat/lon → km) |

---

### 4️⃣ AI Service

| Action | Trigger | Description |
|--------|---------|-------------|
| Load Chat History | User asks question | Retrieve last 10 messages from MongoDB |
| Build Prompt | Before LLM call | SYSTEM_PROMPT + history + new message |
| Generate Response | User asks question | Call Ollama Llama3 model |
| Save Messages | After response | Store user message + AI answer in DB |

---

### 5️⃣ WebSocket Gateway

| Event Name | Trigger | Payload | Description |
|------------|---------|---------|-------------|
| `alert_created` | New alert posted | Alert object | Broadcast to all clients |
| `alert_confirmed` | User confirms alert | Alert object | Real-time confirmation update |
| `alert_denied` | User denies alert | Alert object | Real-time denial update |
| `alert_verified` | Alert reaches 3+ confirmations | Alert object | Alert is now verified |
| `alert_rejected` | Alert confidence ≤ -3 | Alert object | Alert is rejected |
| `alert_deleted` | Alert removed | `{ id }` | Remove from map |
| `alert_confidence_updated` | Confidence changes | Alert object | Update confidence display |

---

### 6️⃣ Cloudinary

| Action | Trigger | Description |
|--------|---------|-------------|
| Upload Image | User creates alert with photo | Store image, return URL |
| Delete Image | User deletes alert | Remove image from storage |

---

## 🔄 KEY WORKFLOWS

### Workflow: User Creates Alert

```
📱 USER ACTION
   ↓
   POST /alerts (with photo, lat, lon, type)
   ↓
🖼️ CLOUDINARY
   Upload image → return URL
   ↓
🔍 SYSTEM CHECKS
   1. Validate coordinates
   2. Search for duplicates (same type, <100m, <10min)
   ↓
   ┌─────────────────────────────────────┐
   │ DUPLICATE FOUND?                    │
   ├─────────────┬───────────────────────┤
   │ YES         │ NO                    │
   ↓             ↓                       
📊 MERGE        🆕 CREATE NEW
   Add to       status: ACTIVE
   confirmedBy  confirmations: 0
   confirmations++
   ↓             ↓
📡 WEBSOCKET     📡 WEBSOCKET
   emit:         emit:
   alert_confirmed  alert_created
   ↓             ↓
✅ RETURN        ✅ RETURN
   Updated alert   New alert
```

---

### Workflow: User Confirms Alert

```
📱 USER ACTION
   ↓
   POST /alerts/:id/confirm
   ↓
🔒 VALIDATION
   - Is user the creator? → ❌ Reject
   - Already confirmed? → ❌ Reject
   ↓
➕ UPDATE ALERT
   confirmedBy.push(userId)
   confirmations++
   ↓
🧮 CALCULATE CONFIDENCE
   For each user in confirmedBy:
      confidence += user.trustScore
   confidence -= denials
   ↓
📊 CHECK STATUS
   ┌────────────────────────────────┐
   │ confirmations >= 3?            │
   ├────────────┬───────────────────┤
   │ YES        │ NO                │
   ↓            ↓                   
   VERIFIED     confidence <= -3?
   ┌────────────┐  ├──────┬────────┤
   │            │ YES     │ NO     
   ↓            ↓  ↓      ↓        
   📈 TRUST     REJECTED  ACTIVE
   Creator      📉 TRUST
   +0.1         Creator
                -0.2
   ↓            ↓         ↓
📡 WEBSOCKET EVENTS
   alert_confirmed
   alert_confidence_updated
   alert_verified (if status changed)
```

---

### Workflow: AI Chat

```
📱 USER ACTION
   ↓
   POST /ai/ask (message: "My tire is flat")
   ↓
🔀 BACKEND PROXY
   Forward to Python AI service
   ↓
💾 LOAD HISTORY
   Get last 10 messages from MongoDB
   ↓
📝 BUILD PROMPT
   SYSTEM: "You are a vehicle assistance expert..."
   USER: "How do I change a tire?"
   AI: "Here are the steps..."
   USER: "My tire is flat" ← new message
   ↓
🤖 OLLAMA LLM
   Model: llama3:8b-instruct-q4_K_M
   Generate response
   ↓
💾 SAVE TO DB
   Save user message
   Save AI response
   ↓
✅ RETURN
   { answer: "To change your flat tire..." }
```

---

## 📊 DATA FLOW SUMMARY

### Create Alert Flow
```
User → Controller → Cloudinary → Service → MongoDB
                                     ↓
                                  Gateway → WebSocket Clients
```

### Confirm/Deny Alert Flow
```
User → Controller → Service → UsersService (get trust scores)
                        ↓
                    Calculate Confidence
                        ↓
                    Update Status
                        ↓
                    Update Creator Trust (if final state)
                        ↓
                    MongoDB
                        ↓
                    Gateway → WebSocket Clients
```

### AI Chat Flow
```
User → Backend → Python AI → MongoDB (history)
                    ↓
                 Ollama LLM
                    ↓
                 MongoDB (save)
                    ↓
                 Backend → User
```

---

## 🎯 BUSINESS RULES

### Trust Score Rules
- **New user**: 1.0
- **Range**: 0.1 - 5.0
- **Increase**: +0.1 when alert becomes VERIFIED
- **Decrease**: -0.2 when alert becomes REJECTED
- **No change**: When alert EXPIRES

### Confidence Score Rules
```
Confidence = SUM(confirming users' trust scores) - denials count

Examples:
  3 users (trust 1.0 each) confirm:
    → 3.0 confidence → VERIFIED ✅
  
  2 users confirm (trust 1.0), 5 denials:
    → 2.0 - 5 = -3.0 → REJECTED ❌
```

### Alert Status Transitions
```
ACTIVE (initial)
  ├→ VERIFIED (confirmations >= 3)
  ├→ REJECTED (confidence <= -3)
  └→ EXPIRED (after 1 hour)

Note: VERIFIED, REJECTED, EXPIRED are final states
```

### Duplicate Detection Rules
**ALL must match:**
1. Same alert type
2. Within 100 meters (Haversine distance)
3. Created in last 10 minutes
4. Status is ACTIVE
5. Different user (not creator's own alert)

**Action:** Merge as confirmation instead of creating new alert

---

## 🔒 SECURITY RULES

| Rule | Description |
|------|-------------|
| JWT Required | Create, confirm, deny, delete alerts + AI chat |
| Password Hashing | bcrypt algorithm |
| Vote Protection | Users cannot vote on own alerts |
| Duplicate Votes | One vote per user per alert |
| File Validation | Max 5MB, images only (jpg, png, gif, webp) |
| Coordinate Validation | Lat: -90 to 90, Lon: -180 to 180 |

---

## 📈 METRICS & LIMITS

| Item | Value |
|------|-------|
| Alert Expiry | 1 hour |
| Duplicate Detection Window | 10 minutes |
| Duplicate Distance Threshold | 100 meters |
| Confirmations for Verification | 3 |
| Confidence for Rejection | ≤ -3 |
| Chat History Limit | Last 10 messages |
| Image Upload Limit | 5 MB |
| JWT Token Expiry | 7 days |
| Trust Score Min/Max | 0.1 / 5.0 |

---

## 🗂️ FILE LOCATIONS

### Controllers (Define Actions)
- `backend/src/auth/auth.controller.ts` - Register, Login
- `backend/src/alerts/alerts.controller.ts` - Alert CRUD, Confirm, Deny
- `backend/src/users/users.controller.ts` - Get User
- `backend/src/ai/ai.controller.ts` - Ask AI

### Services (Business Logic)
- `backend/src/auth/auth.service.ts` - Authentication logic
- `backend/src/alerts/alerts.service.ts` - Alert management, trust system, duplicate detection
- `backend/src/users/users.service.ts` - User management
- `backend/src/ai/ai.service.ts` - AI proxy

### Real-time Communication
- `backend/src/alerts/alerts.gateway.ts` - WebSocket events

### External Services
- `backend/src/utils/cloudinary.service.ts` - Image upload/delete
- `ai/main.py` - AI service with Ollama integration

---

## 🎨 FRONTEND COMPONENTS

| Component | Purpose | Actor |
|-----------|---------|-------|
| `AuthModal.tsx` | Login/Register form | User |
| `AlertMap.tsx` | Display alerts on map | All |
| `CreateAlertModal.tsx` | Create new alert | Authenticated User |
| `AIPage.tsx` | Chat with AI assistant | Authenticated User |
| `ProfilePage.tsx` | View user info, trust score | Authenticated User |
| `useSocket.ts` | WebSocket connection hook | All |

---

## 📚 SUMMARY

### Total Actors: **6**
1. Authenticated User
2. Anonymous User
3. System (Automated)
4. AI Service (External)
5. WebSocket Gateway
6. Cloudinary (External)

### Total Actions: **40+**
- Authentication: 2
- Alert Management: 8
- AI Assistant: 2
- System Automated: 10+
- WebSocket Events: 7
- AI Service: 4
- Cloudinary: 2
- Profile: 1

### Key Features:
✅ Real-time alert updates  
✅ Community-driven verification  
✅ Trust score system  
✅ Duplicate detection  
✅ AI vehicle assistance  
✅ Geolocation filtering  
✅ Image upload  

---

*For detailed UML diagrams, see `UML_DIAGRAMS.puml`*  
*For complete analysis, see `UML_ANALYSIS.md`*  
*For viewing instructions, see `UML_DIAGRAMS_README.md`*

