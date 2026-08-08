# TRACE

> Task-Requirements-Action-Context-Example

## Metadata

- **ID:** trace
- **Name:** TRACE
- **Full Name:** Task-Requirements-Action-Context-Example
- **Complexity:** moderate
- **Best For:** coding, analysis, writing, problem-solving

## Description

Breaks a request into the task, explicit requirements, actions, context, and a worked example.

## Template

```text
Task: {{task}}
Requirements: {{requirements}}
Actions: {{actions}}
Context: {{context}}
Example: {{example}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| task | The exact deliverable to produce | Yes |
| requirements | Explicit constraints and must-haves | Yes |
| actions | The steps or approach to follow | Yes |
| context | Background and environment details | Yes |
| example | A worked example or expected format | Yes |

## Example

```text
Task: Build a Python function that validates email addresses.
Requirements: Use Python 3.11, regex-based, return a boolean, handle None input.
Actions: 1) Strip whitespace 2) Match pattern 3) Return result.
Context: Runs in a FastAPI backend service.
Example: validate_email('user@example.com') -> True
```

## When to Use

When a task needs explicit requirements, step-by-step actions, and an example to remove ambiguity.
