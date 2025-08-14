CREATE TABLE users (
    user_id BIGSERIAL NOT NULL PRIMARY KEY, -- discord user id
    uea_email VARCHAR(255), -- uea email
    mc_username VARCHAR(255), -- there minecraft username
    mc_uuid TEXT, -- there minecraft accounts unique user id
    mc_rank VARCHAR(50) NOT NULL DEFAULT 'unverified' CHECK ("status" IN ('unverified', 'verified', 'member', 'admin')), -- there in gamer permition level
    email_verifid BOOLEAN NOT NULL DEFAULT false, -- have they verifide there email
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);