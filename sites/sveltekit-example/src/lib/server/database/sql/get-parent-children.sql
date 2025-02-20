SELECT * FROM files
WHERE parent_id IS NOT DISTINCT FROM :parent_id
ORDER BY index_in_parent;
