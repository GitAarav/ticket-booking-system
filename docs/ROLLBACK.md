# Rollback

How to undo a change if it breaks something, short and specific rather than generic git theory.

## Undo the most recent commit (not yet pushed)

```
git reset --soft HEAD~1   # keeps the file changes, just uncommits them
# or, to discard the changes entirely:
git reset --hard HEAD~1
```

## Undo a commit that's already pushed

Never force-push over a commit that might be shared. Instead, add a new commit that reverses it:

```
git revert <commit-hash>
git push
```

This keeps history honest (matches the "no rewriting shared history" default) rather than erasing what happened.

## Go back to a known-good checkpoint

Every checkpoint is its own commit (see `ORCHESTRATION.md` for what each one contains). To see the list:

```
git log --oneline
```

To inspect the state at a specific checkpoint without changing anything:

```
git stash          # if you have uncommitted work you want to keep
git checkout <commit-hash>
git checkout main   # come back when done
```

## Recover local dev environment from scratch

If the local database or `.env` gets into a bad state:

```
dropdb ticket_booking
createdb ticket_booking
cd server
cp .env.example .env    # then fill in DATABASE_URL, JWT_SECRET, etc. — .env is never committed
npm run migrate
npm run seed:admin       # SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed:admin
```

## If a migration itself is wrong

Migrations are append-only (see `docs/SYSTEM_DESIGN.md` / the `migrate.js` explanation) — never edit an already-applied `.sql` file. Instead:

1. Write a new migration file (e.g. `002_fix_something.sql`) that corrects the issue.
2. Run `npm run migrate` again — it only applies files not yet recorded in `schema_migrations`.

If a bad migration was applied to a **local dev** database only (never shared), it's simplest to just drop and recreate the database as above and re-run all migrations from scratch.
