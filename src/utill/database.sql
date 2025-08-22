CREATE TABLE players (
    user_id BIGSERIAL NOT NULL unique PRIMARY KEY, -- discord user id
    uea_email VARCHAR(255) unique, -- uea email
    mc_username VARCHAR(255), -- there minecraft username
    mc_uuid TEXT unique, -- there minecraft accounts unique user id
    mc_rank VARCHAR(50) NOT NULL DEFAULT 'unverified' CHECK ("status" IN ('unverified', 'verified', 'member', 'admin')), -- there in gamer permition level
    mc_verifid BOOLEAN NOT NULL DEFAULT false, -- 
    email_verifid BOOLEAN NOT NULL DEFAULT false, -- have they verifide there email
    is_member BOOLEAN NOT NULL DEFAULT false, -- boolean if there a paid member or not
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE warns ( -- 3 warns and the user is added to bans
    user_id BIGSERIAL NOT NULL unique PRIMARY KEY, -- discord user id
    reason TEXT, -- reason for the warning
    img jsonb, -- array of suppoting image urls
    effected_users jsonb, -- array of user ids effected by the culpruit
    warn_effects_bans BOOLEAN DEFAULT true, -- weather this warning will effects bans after being added to bans these are set to fasle so when unbanned old warns wont effect the user but are still stored
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bans ( -- ban effects just minecraft discord ban should be handdled through discord but 
    user_id BIGSERIAL NOT NULL unique PRIMARY KEY, -- culpruit discord user id
    reason TEXT, -- reason for the warning
    banned_till TEXT, -- dd/mm/yyyy of banned till
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
