# Goal

Open source repositories are hard for new developers to contribute to. Beginners may find it difficult to understand where they can contribute without breaking the code.

The goal is to build an **agentic AI system** whose purpose is to identify improvements that can be made via pull requests, clearly explaining **what should be improved**, **why it matters**, and **where the change can be made**.

---

# Key Features

## 1. Repository Analysis
- Parses repository structure and files
- Understands language, frameworks, and project layout

## 2. Improvement Detection
The agentic AI detects:
- Missing or weak error handling
- Code duplication
- Inconsistent naming and formatting issues
- Documentation gaps or outdated README sections
- Lack of comments in complex logic
- Opportunities for modularization or refactoring
- Security issues

## 3. Suggestions
For each identified improvement, the system provides:
- File path and relevant line ranges
- Description of the issue
- Rationale for why the change is beneficial
- Guidance on how the change could be implemented

---

# Agentic Workflow

1. **Understand Repository**
   - Analyze structure, dependencies, and codebase context

2. **Find Improvement Opportunities**
   - Scan code and documentation for potential issues

3. **Decide What Matters**
   - Prioritize improvements based on impact, risk, and beginner-friendliness

4. **Generate Insights**
   - Send selected candidates to the LLM for explanation and reasoning

---

# System Architecture

- **DeepWiki MCP**
  - Finds evidence and improvement opportunities within the repository

- **Agent**
  - Decides, filters, and prioritizes which improvements matter most

- **LLM**
  - Explains issues, provides rationale, and suggests implementation guidance
