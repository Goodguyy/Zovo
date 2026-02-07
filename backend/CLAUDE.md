<stack>
  Bun runtime, Hono web framework, Zod validation.
</stack>

<structure>
  src/index.ts     — App entry, middleware, route mounting
  src/routes/      — Route modules (create as needed)
</structure>

<routes>
  Create routes in src/routes/ and mount them in src/index.ts.

  Example route file (src/routes/todos.ts):
  ```typescript
  import { Hono } from "hono";
  import { zValidator } from "@hono/zod-validator";
  import { z } from "zod";

  const todosRouter = new Hono();

  todosRouter.get("/", (c) => {
    return c.json({ todos: [] });
  });

  todosRouter.post(
    "/",
    zValidator("json", z.object({ title: z.string() })),
    (c) => {
      const { title } = c.req.valid("json");
      return c.json({ todo: { id: "1", title } });
    }
  );

  export { todosRouter };
  ```

  Mount in src/index.ts:
  ```typescript
  import { todosRouter } from "./routes/todos";
  app.route("/api/todos", todosRouter);
  ```

  IMPORTANT: Make sure all endpoints and routes are prefixed with `/api/`
</routes>

<database>
  **IMPORTANT: This project uses Supabase for all database and auth needs.**

  DO NOT use the local SQLite/Prisma setup. Instead:
  - Use Supabase PostgreSQL for data storage
  - Use Supabase Auth for authentication
  - Use Supabase Storage for file uploads

  If backend API routes need to interact with Supabase, use the Supabase JS client with the service role key for server-side operations.

  See the root /CLAUDE.md file for detailed Supabase implementation guidelines.
</database>

<package_management>
  CRITICAL: After using `bun add` to install any package, you MUST immediately commit the updated package.json:

  ```bash
  bun add some-package
  git add package.json bun.lock
  git commit -m "chore: add some-package dependency"
  ```

  Why: If package.json is not committed, the package will be lost when the sandbox restarts,
  causing "Cannot find package" errors on the next session.
</package_management>