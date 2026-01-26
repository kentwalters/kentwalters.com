# Anthropic Claude API Cheat Sheet

A consolidated reference for building agents with Claude.

---

## 1. Tool Definition

```python
TOOLS = [
    {
        "name": "tool_name",
        "description": "What this tool does",
        "input_schema": {
            "type": "object",
            "properties": {
                "param_name": {
                    "type": "string",  # string, number, boolean, array, object
                    "description": "What this param is"
                }
            },
            "required": ["param_name"]
        }
    }
]
```

---

## 2. API Call

```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    system="System prompt here",
    tools=TOOLS,
    messages=messages,
)
```

---

## 3. Response Object

```python
response.stop_reason  # "end_turn" | "tool_use" | "max_tokens" | "stop_sequence"
response.content      # list of content blocks (TextBlock and/or ToolUseBlock)
```

### Content Block Types

**TextBlock:**
```python
block.type  # "text"
block.text  # "Here's the weather..."
```

**ToolUseBlock:**
```python
block.type   # "tool_use"
block.id     # "toolu_abc123" (you need this for tool_result)
block.name   # "get_weather"
block.input  # {"location": "San Francisco, CA"}
```

---

## 4. Stop Reasons

| Stop Reason | Meaning | What to Do |
|-------------|---------|------------|
| `end_turn` | Model finished responding | Return the text, exit loop |
| `tool_use` | Model wants to call tool(s) | Execute tools, send results back |
| `max_tokens` | Hit token limit | Response truncated, may need to continue |
| `stop_sequence` | Hit custom stop sequence | Handle as needed |

---

## 5. Message Shapes

### User Message
```python
{"role": "user", "content": "What's the weather?"}
```

### Assistant Message (add to history)
```python
{"role": "assistant", "content": response.content}
```

### Tool Result (send back to API)
```python
{
    "role": "user",
    "content": [
        {
            "type": "tool_result",
            "tool_use_id": block.id,  # Must match the tool_use block's id
            "content": "65F and sunny"
        }
    ]
}
```

### Tool Result with Error
```python
{
    "type": "tool_result",
    "tool_use_id": block.id,
    "content": "Error: Location not found",
    "is_error": True
}
```

---

## 6. Basic Agent Loop Pattern

```python
def run_agent(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]
    
    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system="You are a helpful assistant.",
            tools=TOOLS,
            messages=messages,
        )
        
        # Always add assistant response to history
        messages.append({"role": "assistant", "content": response.content})
        
        # Done - return text
        if response.stop_reason == "end_turn":
            for block in response.content:
                if block.type == "text":
                    return block.text
            return ""
        
        # Tool use - process and continue
        if response.stop_reason == "tool_use":
            tool_results = process_tool_calls(response)
            messages.append({"role": "user", "content": tool_results})
```

---

## 7. Common Mistakes

| Mistake | Fix |
|---------|-----|
| `messages.append(response.content)` | `messages.append({"role": "assistant", "content": response.content})` |
| `"tool_result_id"` | `"tool_use_id"` |
| `response.content[0].name` without checking type | Loop through blocks, check `block.type == "tool_use"` |
| `"type": "sting"` | `"type": "string"` |

---

## 8. Checking Block Types

```python
# Safe way to extract text
for block in response.content:
    if block.type == "text":
        print(block.text)
    elif block.type == "tool_use":
        print(f"Tool call: {block.name}({block.input})")

# Or using hasattr
for block in response.content:
    if hasattr(block, "text"):
        return block.text
```

---

## 9. Tool Choice Options

| Option | Behavior |
|--------|----------|
| `auto` | Claude chooses to call tools or not |
| `any` | Must use one tool |
| `tool` | Must use tool specified |

---

## 10. Prompt Engineering Principles

| Principle | Why It Matters |
|-----------|----------------|
| **Be explicit** | Claude 4.x follows instructions precisely—vague prompts get vague results |
| **Add context** | Explain _why_ you want something, not just _what_ |
| **Use XML tags** | Structure helps Claude parse complex instructions |
| **Give examples** | Few-shot prompting dramatically improves consistency |

---

## 11. Prompt Structure Template

```
You are a [ROLE] who [CONTEXT/PURPOSE].

<tools>
- tool_name: what it does and when to use it
- another_tool: purpose and triggers
</tools>

<guidelines>
- Instruction with reason (e.g., "Be concise—users need quick answers")
- Another instruction with context
- What to do in edge cases
</guidelines>

<examples>
User: [example input]
Assistant: [example output showing desired behavior]
</examples>
```

---

## 12. Quick Tips

### ✅ Do

- **Specific roles**: "Senior data analyst at a Fortune 500 company" > "analyst"
- **Explain why**: "Never guess—incorrect data could impact business decisions"
- **Show formats**: Include example outputs for structured responses
- **Handle ambiguity**: Tell Claude when to ask for clarification vs. proceed

### ❌ Don't

- Use vague instructions: "be helpful" (too generic)
- Skip context: "be concise" (why? for whom?)
- Write walls of text without structure
- Assume Claude knows your preferences

---

## 13. XML Tags Reference

| Tag | Use For |
|-----|---------|
| `<role>` | Identity and expertise |
| `<context>` | Background information |
| `<tools>` | Available tools and when to use them |
| `<guidelines>` | Behavioral rules |
| `<constraints>` | Hard limits and boundaries |
| `<examples>` | Input/output demonstrations |
| `<output_format>` | Response structure requirements |

---

## 14. Example: Research Agent

```
You are a research assistant helping users answer business questions.

<tools>
- lookup_employee: Find employee info. Use when users ask about people.
- get_sales_data: Quarterly metrics. Use for revenue/performance questions.
- save_to_scratchpad: Store key findings for follow-up questions.
</tools>

<guidelines>
- Be concise—users need quick answers during research sessions
- Cite your source: "According to lookup_employee, Alice earns..."
- Ask for clarification when multiple matches exist
- Save important findings to scratchpad for multi-turn conversations
</guidelines>

<example>
User: "What's Alice's salary?"
Assistant: "I found two employees named Alice. Could you specify:
- Alice Johnson (Engineering)
- Alice Chen (Marketing)"
</example>
```

---

## 15. Claude 4.x Specific Notes

- **More literal**: Follows instructions exactly—be precise
- **Less verbose**: May skip summaries unless asked
- **Tool-aware**: Explicitly mention when to use which tools
- **Steerable**: Responds well to direct guidance

---

## 16. Testing Your Prompt

1. Does it define a clear role?
2. Does it explain _why_ for key instructions?
3. Are edge cases handled?
4. Is there at least one example?
5. Would a stranger understand what you want?

---

## 17. Best Practices for Tool Definitions

**Provide extremely detailed descriptions.** This is by far the most important factor in tool performance. Your descriptions should explain every detail about the tool, including:

- What the tool does
- When it should be used (and when it shouldn't)
- What each parameter means and how it affects the tool's behavior
- Any important caveats or limitations, such as what information the tool does not return if the tool name is unclear

The more context you can give Claude about your tools, the better it will be at deciding when and how to use them. **Aim for at least 3-4 sentences per tool description**, more if the tool is complex.

---

## 18. Compaction Prompt (for long conversations)

```javascript
const compactionPrompt = `Summarize this conversation concisely for context continuity.
PRESERVE:
- The user's original request/goal
- All tool call results with their exact values
- Key decisions made
- Current progress and what remains to be done
- Any errors encountered
OMIT:
- Redundant reasoning or explanations
- Failed approaches (unless relevant to avoid repeating)
- Verbose tool call metadata
<conversation>
${JSON.stringify(messages, null, 2)}
</conversation>
Return a concise summary (under 300 words) that would allow the conversation to continue seamlessly.`;
```

---

## 19. Model Strings

| Model | String |
|-------|--------|
| Claude Opus 4.5 | `claude-opus-4-5-20251101` |
| Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` |
| Claude Sonnet 4 | `claude-sonnet-4-20250514` |
| Claude Opus 4 | `claude-opus-4-20250514` |

---

_Sources: Anthropic Claude API Reference, Anthropic Prompt Engineering Docs_
