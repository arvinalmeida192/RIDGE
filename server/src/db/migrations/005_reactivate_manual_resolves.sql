-- Revert alerts that were manually resolved via the dashboard (not natural de-escalation)
UPDATE alerts a
SET is_active = true, resolved_at = NULL
FROM notification_log nl
WHERE nl.alert_id = a.id
  AND nl.recipient = 'manual_resolve'
  AND a.is_active = false;
