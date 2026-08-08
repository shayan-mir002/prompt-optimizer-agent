# No Framework

> Direct Instruction

## Metadata

- **ID:** no-framework
- **Name:** No Framework
- **Full Name:** Direct Instruction
- **Complexity:** none
- **Best For:** translation, simple-qa, short-instructions, definition, calculation

## Description

No framework needed. The task is clear, simple, or well-defined enough to handle with a direct instruction.

## Template

```text
{{instruction}}
```

## Variables

| Name | Description | Required |
| ---- | ----------- | :------: |
| instruction | The direct instruction or question | Yes |

## Example

```text
Translate 'Good morning, how are you?' to French, Japanese, and Spanish.
```

## When to Use

When the user's request is already clear and well-structured. Adding framework overhead would waste tokens and reduce quality. Includes: translations, simple Q&A, definitions, calculations, short clear instructions, and single-step tasks.
