# SCOPE

> Situation-Constraints-Objective-Plan-Execute

## Metadata

- **ID:** scope
- **Name:** SCOPE
- **Full Name:** Situation-Constraints-Objective-Plan-Execute
- **Complexity:** advanced
- **Best For:** planning, strategy, problem-solving, coding, project-management

## Description

A project-oriented framework that walks through situation analysis, constraints, objectives, planning, and execution.

## Template

```text
Situation: {{situation}}
Constraints: {{constraints}}
Objective: {{objective}}
Plan: {{plan}}
Execute: {{execute}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| situation | Current state and background | Yes |
| constraints | Limitations, boundaries, and restrictions | Yes |
| objective | What needs to be achieved | Yes |
| plan | The approach or strategy to follow | Yes |
| execute | Concrete steps to execute the plan | Yes |

## Example

```text
Situation: Our e-commerce site handles 10K requests/sec normally but crashes during flash sales (100K+ requests/sec).
Constraints: Budget of $5K/month, must use AWS, can't rewrite the monolithic codebase, need solution within 4 weeks.
Objective: Design an auto-scaling architecture that handles 10x traffic spikes without downtime.
Plan: Implement CDN caching for static assets, add read replicas for the database, deploy queue-based order processing.
Execute: Week 1: CDN setup. Week 2: Database scaling. Week 3: Queue implementation. Week 4: Load testing and optimization.
```

## When to Use

For complex projects or problems where you need structured thinking from analysis through execution.
