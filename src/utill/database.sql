CREATE TABLE players (
    user_id BIGSERIAL NOT NULL unique PRIMARY KEY, -- discord user id
    uea_email VARCHAR(255) unique, -- uea email
    mc_username VARCHAR(255), -- there minecraft username
    mc_uuid TEXT unique, -- there minecraft accounts unique user id
    mc_rank VARCHAR(50) NOT NULL DEFAULT 'unverified' CHECK ("status" IN ('unverified', 'verified', 'member', 'tester', 'admin')), -- there in gamer permition level
    mc_verifid BOOLEAN NOT NULL DEFAULT false, -- 
    email_verifid BOOLEAN NOT NULL DEFAULT false, -- have they verifide there email
    is_member BOOLEAN NOT NULL DEFAULT false, -- boolean if there a paid member or not
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE warns ( -- 3 warns and the user is added to bans
    warn_id BIGSERIAL NOT NULL unique PRIMARY KEY, -- id for the warning
    user_id BIGSERIAL NOT NULL, -- discord user id
    isuer BIGSERIAL NOT NULL, -- discord user id of the committee member issuing the ban
    reason TEXT, -- reason for the warning
    img jsonb, -- array of suppoting image urls
    effected_users jsonb, -- array of user ids effected by the culpruit
    warn_effects_bans BOOLEAN DEFAULT true, -- weather this warning will effects bans after being added to bans these are set to fasle so when unbanned old warns wont effect the user but are still stored
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bans ( -- ban effects just minecraft discord ban should be handdled through discord but 
    ban_id NOT NULL unique PRIMARY KEY, -- id for the ban
    user_id BIGSERIAL NOT NULL, -- culpruit discord user id
    reason TEXT, -- reason for the warning
    banned_till TEXT, -- dd/mm/yyyy of banned till
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
