---
name: author-skill
description: "Help the user write a new reusable skill (instructions for the assistant) and save it as a personal or organization skill. Use when the user says 'remember how we do X', 'make this a skill' or wants to import a SKILL.md."
allowed-tools: skill_list skill_get skill_create skill_import skill_update skill_publish
metadata:
  title: "Author a skill"
---

# Author a skill

Goal: turn a way of working into a short, reusable skill.

## Steps

1. Check for an existing skill first with `skill_list` (use `q` with a keyword). Suggest
   improving an existing one with `skill_update` instead of creating a duplicate.
2. Draft the skill with the user:
   - `name`: a short display name; the slug is derived from it.
   - `description`: one or two sentences saying *when* to use the skill. The assistant picks
     skills from this text, so mention the user's typical phrasing.
   - `instructions`: markdown with a goal, numbered steps and rules. Reference real tool names.
   - `allowedTools`: only the tools the steps need.
3. Save it with `skill_create` (scope `PERSONAL` unless the user is an admin and asks for
   `ORGANIZATION`). If the user pasted a SKILL.md, use `skill_import` instead.
4. Skills start as DRAFT. Offer `skill_publish` when the user is happy with it.

## Rules

- Never put secrets, passwords or personal data about guests into a skill.
- Keep instructions short; long skills are followed less reliably.
