CREATE TABLE players (
    user_id BIGINT UNSIGNED PRIMARY KEY, -- discord user id
    uea_email VARCHAR(255) UNIQUE, -- uea email
    mc_username VARCHAR(255), -- minecraft username
    mc_uuid CHAR(36) UNIQUE, -- UUIDs are fixed length (36 chars)
    mc_rank ENUM('unverified', 'verified', 'member', 'tester', 'admin') NOT NULL DEFAULT 'unverified', -- permission level
    is_member BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warns (
    warn_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- warning id
    user_id BIGINT UNSIGNED NOT NULL, -- discord user id (FK?)
    issuer BIGINT UNSIGNED NOT NULL, -- discord id of committee member
    reason TEXT,
    img JSON, -- array of supporting image URLs
    effected_users JSON, -- array of user ids affected
    warn_effects_bans BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES players(user_id) ON DELETE CASCADE
);

CREATE TABLE bans (
    ban_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reason TEXT,
    banned_till BIGINT, -- until what date/time they’re banned
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES players(user_id) ON DELETE CASCADE
);
