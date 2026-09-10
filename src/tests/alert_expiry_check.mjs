import assert from 'node:assert';

const ALERT_EXPIRY_MS = 7 * 60 * 60 * 1000;

function getAlertRemainingTime(createdAt) {
  if (!createdAt) return 'Expires in <7h';
  const remaining = ALERT_EXPIRY_MS - (Date.now() - createdAt);
  if (remaining <= 0) return 'Expiring now';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`;
  }
  return `Expires in ${Math.max(1, minutes)}m`;
}

console.log('Running Alert Expiry Logic Self-Check...');

// 1. Verify 7 hours window in milliseconds
assert.strictEqual(ALERT_EXPIRY_MS, 7 * 60 * 60 * 1000, 'ALERT_EXPIRY_MS must equal 7 hours in ms');
assert.strictEqual(ALERT_EXPIRY_MS, 25200000, 'ALERT_EXPIRY_MS must be 25,200,000 ms');

// 2. Alert created 6 hours ago (< 7h) should be active
const now = Date.now();
const sixHoursAgo = now - 6 * 60 * 60 * 1000;
const isSixHoursExpired = (now - sixHoursAgo) >= ALERT_EXPIRY_MS;
assert.strictEqual(isSixHoursExpired, false, 'Alert 6 hours old must not be expired');

// 3. Alert created 7 hours and 1 minute ago (> 7h) should be expired
const sevenHoursOneMinAgo = now - (7 * 60 + 1) * 60 * 1000;
const isSevenHoursExpired = (now - sevenHoursOneMinAgo) >= ALERT_EXPIRY_MS;
assert.strictEqual(isSevenHoursExpired, true, 'Alert 7h 1m old must be expired');

// 4. Test remaining time calculation
const remainingText = getAlertRemainingTime(now - 2 * 60 * 60 * 1000); // 2 hours elapsed -> ~5h left
assert.match(remainingText, /^Expires in (4h 59m|5h 0m)/, `Remaining time text expected ~5h, got: ${remainingText}`);

const expiredText = getAlertRemainingTime(sevenHoursOneMinAgo);
assert.strictEqual(expiredText, 'Expiring now', 'Past alerts should indicate Expiring now');

console.log('✓ All Alert Expiry Self-Checks Passed Successfully!');
