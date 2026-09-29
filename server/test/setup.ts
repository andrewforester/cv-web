// No real LLM calls in tests: drop any key and chat env a developer's shell may carry.
delete process.env.ANTHROPIC_API_KEY;
delete process.env.CHAT_MODEL;
delete process.env.CHAT_ENABLED;
delete process.env.CHAT_FAKE_LLM;
delete process.env.CHAT_DAILY_BUDGET_USD;
