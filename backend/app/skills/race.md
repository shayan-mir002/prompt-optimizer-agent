# RACE

> Role-Action-Context-Expectation

## Metadata

- **ID:** race
- **Name:** RACE
- **Full Name:** Role-Action-Context-Expectation
- **Complexity:** moderate
- **Best For:** writing, analysis, coding, content-creation, problem-solving

## Description

Assigns a role, defines the action, provides context, and sets clear expectations.

## Template

```text
You are {{role}}.

Action: {{action}}
Context: {{context}}
Expectation: {{expectation}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| role | The expert role to assume | Yes |
| action | What needs to be accomplished | Yes |
| context | Relevant background information | Yes |
| expectation | Specific requirements for the output | Yes |

## Example

```text
You are a senior data scientist with expertise in customer analytics.

Action: Build a customer churn prediction model.
Context: We have 2 years of transaction data with 50K customers. Current churn rate is 15% monthly.
Expectation: A Python notebook with feature engineering, model selection, evaluation metrics, and actionable retention strategies.
```

## When to Use

When the task benefits from a clear role assignment combined with rich context and explicit expectations.
