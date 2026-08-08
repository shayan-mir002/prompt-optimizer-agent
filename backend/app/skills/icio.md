# ICIO

> Instructions-Context-Input-Output

## Metadata

- **ID:** icio
- **Name:** ICIO
- **Full Name:** Instructions-Context-Input-Output
- **Complexity:** moderate
- **Best For:** coding, data-analysis, analysis, problem-solving

## Description

Specifies clear instructions, context, the input data, and the expected output format.

## Template

```text
Instructions: {{instructions}}
Context: {{context}}
Input: {{input}}
Output: {{output}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| instructions | What the model should do with the input | Yes |
| context | Background that affects how to interpret the input | Yes |
| input | The data or material to process | Yes |
| output | The exact format and structure of the result | Yes |

## Example

```text
Instructions: Classify each customer review as positive, neutral, or negative.
Context: Customer feedback from a SaaS product.
Input: A CSV of recent reviews.
Output: A CSV with the original review and a sentiment column.
```

## When to Use

When the model must process concrete input and return a precisely defined output.
