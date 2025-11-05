CREATE TABLE players (
    user_id BIGINT UNSIGNED PRIMARY KEY, -- discord user id
    uea_email VARCHAR(255) UNIQUE, -- uea email
    mc_username VARCHAR(255), -- minecraft username
    bed_mc_username VARCHAR(255),
    mc_uuid CHAR(36) UNIQUE, -- UUIDs are fixed length (36 chars)
    mc_rank ENUM('unverified', 'verified', 'member', 'tester', 'admin') NOT NULL DEFAULT 'unverified', -- permission level
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

CREATE TABLE servers (
    id VARCHAR(40) PRIMARY KEY,
    name TEXT,
    emoji text,
    host TEXT,
    game_port TEXT,
    port TEXT,
    user TEXT,
    pass TEXT,
    currently_online BIGINT,
    online BOOLEAN DEFAULT true
)

CREATE TABLE guild_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting JSON
)

CREATE TABLE online_players (
    uuid VARCHAR(40) PRIMARY KEY,
    name TEXT,
    level INT,
    health INT,
    gamemode VARCHAR(40),
    server VARCHAR(40)
)

CREATE TABLE player_members (
    id VARCHAR(8) PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    FOREIGN KEY (user_id) REFERENCES players(user_id)
)