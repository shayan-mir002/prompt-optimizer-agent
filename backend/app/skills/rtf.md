# RTF

> Role-Task-Format

## Metadata

- **ID:** rtf
- **Name:** RTF
- **Full Name:** Role-Task-Format
- **Complexity:** simple
- **Best For:** writing, content-creation, analysis, summarization

## Description

A simple framework that assigns a role, defines the task, and specifies the output format.

## Template

```text
You are {{role}}. {{task}}

Output in {{format}}.
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| role | The expert role to assign | Yes |
| task | The specific task to accomplish | Yes |
| format | Desired output format | Yes |

## Example

```text
You are a professional copywriter. Write a product description for a new wireless headphone.

Output in a compelling marketing paragraph.
```

## When to Use

When the task is straightforward and needs clear role assignment, a defined task, and a specific format. Great for everyday tasks.
