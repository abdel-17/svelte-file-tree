UPDATE files
SET name = :name, updated_at = CURRENT_TIMESTAMP
WHERE id = :id;
