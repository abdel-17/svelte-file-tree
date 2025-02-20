UPDATE files
SET index_in_parent = index_in_parent + :by, updated_at = CURRENT_TIMESTAMP
WHERE parent_id IS NOT DISTINCT FROM :parent_id and index_in_parent >= :start;
