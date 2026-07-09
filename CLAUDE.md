# Project Rules & Conventions

- This is an AI dropshipping factory managed by Hermes orchestration system.
- All core agent logic lives in the `/agents` folder.
- All database connections MUST use the Supabase client defined in `db.js`.
- NEVER hardcode API keys. Use environment variables (.env file).
- Always run `pm2 restart all` after modifying agent scripts.
- Prioritize clean, modular code with clear separation of concerns.
- Each agent is stateless and communicates through Supabase tables.
- Log all agent activities to the `campaign_logs` table for audit trail.
- Use ISO 8601 timestamps for all database records.
