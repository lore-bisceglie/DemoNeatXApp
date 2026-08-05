-- The complete additive staff-access and request schema was consolidated into
-- the preceding runtime-sync migration so legacy tenant databases receive all
-- missing columns in one transaction. Keep this migration as an explicit
-- no-op to preserve the published migration history without attempting to add
-- the same columns and indexes a second time.
SELECT 1;
