# ROLE

> Role-Objective-Context-Expectation

## Metadata

- **ID:** role
- **Name:** ROLE
- **Full Name:** Role-Objective-Context-Expectation
- **Complexity:** simple
- **Best For:** writing, content-creation, analysis, problem-solving

## Description

Assigns an expert persona and defines the objective, context, and expected results.

## Template

```text
You are an expert {{role}}.

Objective: {{objective}}
Context: {{context}}
Expectations: {{expectations}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| role | The expert role to adopt | Yes |
| objective | The goal to accomplish | Yes |
| context | Relevant background information | Yes |
| expectations | Quality, format, and constraint expectations | Yes |

## Example

```text
You are an expert marketing copywriter.

Objective: Write a launch email for a new budgeting app.
Context: The app targets millennials who want simple money tracking.
Expectations: Friendly tone, 150 words, one clear call-to-action.
```

## When to Use

When adopting a specific expert persona improves the authority and quality of the output.
