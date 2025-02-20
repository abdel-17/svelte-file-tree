UPDATE files
SET parent_id = :parent_id, index_in_parent = :index_in_parent, updated_at = CURRENT_TIMESTAMP
WHERE id = :id;
