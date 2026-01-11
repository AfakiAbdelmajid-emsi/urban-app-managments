# 🎯 How Trust Score Increases - Explained

## How It Works (Step by Step)

### Example: User A creates alert, User B confirms

**Step 1: User A creates alert**
- Alert confidenceScore = **0**
- Alert status = **ACTIVE**
- User A's trustScore = **1.0** (unchanged)

**Step 2: User B confirms the alert**
- User B's trustScore = 2.0 (for example)
- Alert confidenceScore = **2.0** (sum of confirming users' trust scores)
- Alert status = **ACTIVE** (not yet VERIFIED - needs ≥ 5)
- User A's trustScore = **1.0** (still unchanged - alert not verified yet)

**Step 3: More users confirm until confidenceScore ≥ 5**
- User C (trustScore: 1.5) confirms → confidenceScore = 3.5
- User D (trustScore: 2.5) confirms → confidenceScore = **6.0** ✅
- Alert status changes to **VERIFIED**
- **NOW** User A's trustScore increases: **1.0 → 1.1** (+0.1)

## Key Points:

1. ❌ **One confirmation is NOT enough** - Trust score only increases when alert becomes VERIFIED (confidenceScore ≥ 5)

2. ✅ **Confidence Score Formula**: 
   - `confidenceScore = sum(confirming users' trustScores) - denialsCount`
   - Example: User B (2.0) + User C (1.5) + User D (2.5) = 6.0

3. ✅ **Trust Score Updates Only When**:
   - Alert becomes **VERIFIED** (confidenceScore ≥ 5) → Creator gets +0.1
   - Alert becomes **REJECTED** (confidenceScore ≤ -3) → Creator gets -0.2

4. ✅ **To Check Alert Confidence**:
   - Look at `confidenceScore` field
   - Look at `status` field (ACTIVE / VERIFIED / REJECTED / EXPIRED)
   - Look at `verified` field (true/false)

## Visual Indicators Needed:

- 🟢 **VERIFIED** (green) - Confidence ≥ 5, Creator got +0.1 trust
- 🟡 **ACTIVE** (yellow) - Confidence 0-4.9, waiting for more confirmations
- 🔴 **REJECTED** (red) - Confidence ≤ -3, Creator got -0.2 trust
- ⚪ **EXPIRED** (gray) - Time expired, no trust change

