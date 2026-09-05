---
name: API schema generator compatibility
description: Compatibility note for OpenAPI-to-Zod generation in this workspace.
---

The installed OpenAPI generator currently emits `zod.int()` for OpenAPI integer schemas, while the workspace resolves a Zod version that does not expose that helper.

**Why:** A contract change can make codegen succeed but make the chained library typecheck fail.

**How to apply:** Prefer `type: number` for generated API fields unless integer-specific runtime validation is required and the Zod/toolchain versions have been aligned. Always run codegen followed by the workspace library typecheck after spec changes.