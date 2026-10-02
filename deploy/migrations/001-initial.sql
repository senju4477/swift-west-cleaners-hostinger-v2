-- Migration 001: initial MySQL enquiry schema. Import only into the NEW database.
-- DDL is not transactionally rollbackable. Re-import does not upgrade an old schema.
-- Before a retry, verify the recorded checksum and table columns in phpMyAdmin.
-- checksum: 21f948259e532eb73f30dbcd3fa4ed8e847fb850f0a78e7fc64e30bf435f438a

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(191) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  created_at VARCHAR(40) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  suburb TEXT NOT NULL,
  service TEXT NOT NULL,
  property TEXT NULL,
  size TEXT NULL,
  preferred_date TEXT NULL,
  preferred_time TEXT NULL,
  details TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version, checksum) VALUES ('001', '21f948259e532eb73f30dbcd3fa4ed8e847fb850f0a78e7fc64e30bf435f438a')
ON DUPLICATE KEY UPDATE version = version;
