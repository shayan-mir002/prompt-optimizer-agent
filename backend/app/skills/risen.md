# RISEN

> Role-Instructions-Steps-End goal- Narrowing

## Metadata

- **ID:** risen
- **Name:** RISEN
- **Full Name:** Role-Instructions-Steps-End goal- Narrowing
- **Complexity:** advanced
- **Best For:** coding, problem-solving, planning, analysis, process-design

## Description

Assigns a role, gives instructions, defines steps, sets the end goal, and narrows the scope.

## Template

```text
Role: {{role}}

Instructions:
{{instructions}}

Steps:
{{steps}}

End Goal: {{end_goal}}

Narrowing: {{narrowing}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| role | The expert role to assume | Yes |
| instructions | Detailed instructions for the task | Yes |
| steps | Step-by-step approach | Yes |
| end_goal | The final desired outcome | Yes |
| narrowing | Constraints or focus areas to narrow scope | Yes |

## Example

```text
Role: Senior DevOps engineer specializing in CI/CD pipelines.

Instructions: Design a deployment pipeline for our microservices architecture.
Steps:
1. Audit current manual deployment process
2. Identify bottlenecks and failure points
3. Design automated pipeline stages
4. Select appropriate tools
5. Create rollback strategy

End Goal: Fully automated CI/CD pipeline that deploys to production in under 15 minutes.

Narrowing: Focus on GitHub Actions and AWS ECS. No Kubernetes for now.
```

## When to Use

When a task requires structured execution with clear boundaries and a defined end state.
