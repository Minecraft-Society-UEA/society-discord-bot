CREATE TABLE players (
    user_id BIGSERIAL NOT NULL PRIMARY KEY, -- discord user id
    uea_email VARCHAR(255), -- uea email
    mc_username VARCHAR(255), -- there minecraft username
    mc_uuid TEXT, -- there minecraft accounts unique user id
    mc_rank VARCHAR(50) NOT NULL DEFAULT 'unverified' CHECK ("status" IN ('unverified', 'verified', 'member', 'admin')), -- there in gamer permition level
    mc_verifid BOOLEAN NOT NULL DEFAULT false, -- 
    email_verifid BOOLEAN NOT NULL DEFAULT false, -- have they verifide there email
    is_member BOOLEAN NOT NULL DEFAULT false, -- boolean if there a paid member or not
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);