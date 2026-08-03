# Next.js Web Rules


## Architecture

Use feature-based structure:

src/features/

auth/
students/
teachers/
attendance/
fees/
reports/


Each feature:

components/
hooks/
api/
types/
utils/


## Rules

- Do not put business logic inside components.
- Use reusable hooks.
- Keep API calls separated.
- Avoid duplicate components.
- Maintain responsive UI.

Before changing large features:

Use Graphify.