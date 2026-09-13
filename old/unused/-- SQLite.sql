-- SQLite
UPDATE site_settings
SET events_confirmed = 1,
    ticket_url = 'https://posh.vip/e/get-plugged-mixer';

SELECT * FROM site_settings;
