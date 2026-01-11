# 🎯 How Trust Score Works - Complete Guide

## 📋 Quick Answer to Your Questions

### Q1: How does User A's trust score go up when User B confirms their alert?

**Answer:** User A's trust score **doesn't go up immediately** when User B confirms. Here's why:

1. **One confirmation is NOT enough** - The alert needs to reach `confidenceScore ≥ 5` to become VERIFIED
2. **Only when alert becomes VERIFIED** - User A gets +0.1 trust score
3. **Formula**: `confidenceScore = sum(confirming users' trustScores) - denials`

**Example:**
- User A creates alert → confidenceScore = 0
- User B (trustScore: 2.0) confirms → confidenceScore = 2.0 (not enough!)
- User C (trustScore: 1.5) confirms → confidenceScore = 3.5 (still not enough!)
- User D (trustScore: 2.5) confirms → confidenceScore = 6.0 ✅
- **NOW** alert becomes VERIFIED
- **NOW** User A's trustScore: 1.0 → 1.1 (+0.1)

### Q2: How to know if an alert is confident/verified?

**Answer:** The UI now shows this! Look for:

1. **Status Badge** (next to alert title):
   - 🟢 **VERIFIED** (green) - Confidence ≥ 5, creator got +0.1 trust
   - 🟡 **ACTIVE** (yellow) - Still needs more confirmations
   - 🔴 **REJECTED** (red) - Confidence ≤ -3, creator lost -0.2 trust
   - ⚪ **EXPIRED** (gray) - Time expired

2. **Confidence Score Card** (in alert details):
   - Shows current confidence score (e.g., "2.0 / 5.0 needed")
   - Shows how much more is needed to verify
   - Shows verification status

3. **Visual Indicators**:
   - Check mark icon = Verified
   - Progress indicator = Current confidence level

---

## 🔄 Complete Workflow Example

### Scenario: User A creates alert, Users B, C, D confirm

**Step 1: User A creates alert**
```
Alert:
  - confidenceScore: 0
  - status: ACTIVE
  - verified: false

User A:
  - trustScore: 1.0 (unchanged)
```

**Step 2: User B (trustScore: 2.0) confirms**
```
Alert:
  - confidenceScore: 2.0 (0 + 2.0)
  - status: ACTIVE (needs ≥ 5)
  - verified: false

User A:
  - trustScore: 1.0 (still unchanged - not verified yet!)
```

**Step 3: User C (trustScore: 1.5) confirms**
```
Alert:
  - confidenceScore: 3.5 (2.0 + 1.5)
  - status: ACTIVE (still needs ≥ 5)
  - verified: false

User A:
  - trustScore: 1.0 (still unchanged)
```

**Step 4: User D (trustScore: 2.5) confirms**
```
Alert:
  - confidenceScore: 6.0 (3.5 + 2.5) ✅
  - status: VERIFIED (reached ≥ 5!) ✅
  - verified: true ✅

User A:
  - trustScore: 1.1 (1.0 + 0.1) ✅ FINALLY INCREASED!
```

---

## 🎨 What You See in the UI

### Alert Details Card Shows:

1. **Status Badge** (top right of title):
   ```
   [Alert Type] [🟢 VERIFIED] or [🟡 ACTIVE]
   ```

2. **Confidence Score Card** (prominent display):
   ```
   ┌─────────────────────────────────┐
   │ 📈 Confidence Score              │
   │ 2.0 / 5.0 needed for verification│
   │                                   │
   │ ⏳ Needs 3.0 more confidence     │
   │    to be verified                │
   └─────────────────────────────────┘
   ```

3. **For VERIFIED alerts**:
   ```
   ┌─────────────────────────────────┐
   │ 📈 Confidence Score    ✓ Verified│
   │ 5.2 / 5.0 needed                │
   │                                   │
   │ ✓ This alert has been verified   │
   │   Creator gained +0.1 trust      │
   └─────────────────────────────────┘
   ```

---

## 📊 Trust Score Updates

### When Trust Score Changes:

| Alert Status | Creator Trust Score Change |
|--------------|---------------------------|
| **VERIFIED** (confidenceScore ≥ 5) | **+0.1** |
| **REJECTED** (confidenceScore ≤ -3) | **-0.2** |
| **ACTIVE** | No change |
| **EXPIRED** | No change |

### Trust Score Range:
- **Minimum**: 0.1
- **Maximum**: 5.0
- **Default (new users)**: 1.0

---

## 🔍 How to Check Alert Confidence/Status

### In the App:

1. **Click on any alert** on the map
2. **Look at the Alert Details card**:
   - Status badge shows: VERIFIED / ACTIVE / REJECTED / EXPIRED
   - Confidence score shows current value
   - Message explains what's happening

### In the Database:

```javascript
// Check alert
db.alerts.findOne({ _id: "..." })

// Look at these fields:
{
  confidenceScore: 2.0,      // Current confidence
  status: "ACTIVE",          // Current status
  verified: false,           // Is it verified?
  confirmations: 2,          // Number of confirmations
  denials: 0                 // Number of denials
}

// Check user trust score
db.users.findOne({ _id: "userA_id" })

// Look at:
{
  trustScore: 1.0            // User's trust score
}
```

---

## ✅ Summary

1. **Trust score increases when**: Alert becomes VERIFIED (confidenceScore ≥ 5)
2. **One confirmation is NOT enough** - Need multiple confirmations from users with good trust scores
3. **To check if alert is verified**: Look at status badge and confidence score card in the alert details
4. **Real-time updates**: Confidence and status update instantly via WebSocket

---

## 🧪 Test It Yourself

1. Create an alert as User A
2. Confirm it as User B
3. Check the confidence score - it should increase
4. Confirm as more users until confidenceScore ≥ 5
5. Check - alert should become VERIFIED
6. Check User A's profile - trustScore should be +0.1

The UI now shows everything you need! 🎉

