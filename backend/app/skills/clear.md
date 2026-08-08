# CLEAR

> Completeness-Lacking Details Extraction & Adaptive Refinement

## Metadata

- **ID:** clear
- **Name:** CLEAR
- **Full Name:** Completeness-Lacking Details Extraction & Adaptive Refinement
- **Complexity:** moderate
- **Best For:** clarification, detail-extraction, prompt-analysis, interactive-refinement, writing, coding, planning

## Description

A specialized framework designed to extract missing details, clarify implicit assumptions, and structure vague prompts into highly actionable specifications.

## Template

```text
Context & Background: {{context}}
Primary Objective: {{objective}}
Explicit Constraints & Requirements: {{constraints}}
Target Audience & Output Format: {{format_and_audience}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| context | Background information, technical environment, or domain setting | Yes |
| objective | The exact deliverable or primary task to accomplish | Yes |
| constraints | Guidelines, negative rules, tech stack constraints, or boundaries | Yes |
| format_and_audience | Target audience, tone, structure, and output formatting expectations | Yes |

## Example

```text
Context & Background: Building a customer-facing fintech web dashboard.
Primary Objective: Write a user registration API endpoint handler with validation.
Explicit Constraints & Requirements: Use Python 3.11 with FastAPI, async/await syntax, bcrypt password hashing, and return HTTP 400 on duplicate emails.
Target Audience & Output Format: Senior backend developers; return clean documented python code with type hints.
```

## When to Use

When a prompt lacks explicit parameters, constraints, or structural guidelines, requiring intelligent detail extraction.
