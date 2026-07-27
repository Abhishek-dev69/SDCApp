# Database migrations

The Cloud SQL `sdc_database` schema is the source of truth.

- `001_core_institute.sql` is a no-op marker for an obsolete UUID design. Do not restore or run the old statements.
- `002_teachers.sql` is an additive teacher-profile and batch-assignment design for the current integer-ID schema.
- `003_academic_operations.sql` adds attendance, tests/results, homework, fee invoices, and doubts.

Before applying a migration:

1. Take a Cloud SQL backup.
2. Export the current schema with `pg_dump --schema-only`.
3. Test the migration against a staging database restored from production.
4. Apply it to production only after API tests pass in staging.

The `auth.role` check constraint must be inspected before teacher login is enabled. The teacher profile tables can be installed without changing that constraint.

Run these read-only checks in `sdc_database` before applying the migrations:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('auth'::regclass, 'lectures'::regclass)
  AND contype = 'c'
ORDER BY conrelid::regclass::text, conname;

SELECT table_name, column_name, column_default, is_identity
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('auth', 'batches', 'lectures', 'announcements')
ORDER BY table_name, ordinal_position;
```

Teacher account creation requires `auth.role` to accept `teacher`. Owner login requires it to accept `owner`.
Lecture creation expects the existing status constraint to accept `scheduled`, `live`, `completed`, and `cancelled`.
