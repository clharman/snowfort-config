Let's change the layout of the application. We're going to make it INSPIRED BY (but not identical to) Cursor's cmd-j AI settings screen.

<insert screenshot>

Note the menu bar on the left hand side rather than the top.

You are going to redesign the app to have a similar format and experience. Begin with the below instructions:

- Our side menu bar will contain the following:
  - Claude Code/Codex selector (similar to what's marked (filter) in the current version under projects) - If either is not available (based on what you've recognized), grey it out. Note - it's not "Claude", but rather Claude Code. Standalone Claude is something different and we don't want to deal with it. If both are available, start with Claude Code selected. If NEITHER is available, show "Initialize Claude Code or OpenAI Codex to continue" in the main area of the screen.

  Provided one is selected, you will show in the side menu bar, beneath the selector (if applicable)
  - Search settings, just like in the cursor screenshot
  - If Claude Code is selected (everything here so far coming from the .claude.json file)
    - "Global" section with the following subsections:
      - Updates & Version
        - autoUpdates – turn automatic update checks on/off
        - installMethod – how Claude Code was installed (brew, npm, unknown, …)
        - lastOnboardingVersion / hasCompletedOnboarding – reset these to force the interactive onboarding again
      - Permissions & Warnings
        - fallbackAvailableWarningThreshold – % threshold before Claude warns that your model quota is almost exhausted
        - bypassPermissionsModeAccepted – if true, you no longer get permission prompts for tool calls
      - Keyboard & Terminal Integration
        - optionAsMetaKeyInstalled – whether the macOS "⌥ as Meta" key-remap was applied
        - appleTerminalSetupInProgress / appleTerminalBackupPath – one-time Terminal integration wizard settings
      - Usage & Tips
        - numStartups – purely a counter, but you may reset it if you want to "start fresh"
        - tipsHistory & promptQueueUseCount – keep track of which in-product tips you've seen; setting counts to 0 re-shows the tips
        - subscriptionNoticeCount / hasAvailableSubscription – control whether upgrade nags appear
      - Read-only Info
        - userID – anonymised hash that ties your installs together
        - firstStartTime – timestamp when you first ran Claude Code
        - oauthAccount – email, org UUID, and role for your Claude account
        - cachedChangelog / changelogLastFetched / lastReleaseNotesSeen – makes the release-notes panel instant
        - tipsHistory (per-tip counters) – nice for analytics
    - "Project" section, with a subsection list beneath it of all the projects recognized (these are the paths found in the .claude.json file). Each project detail panel will contain the following subsections:
      - MCP Servers
        - mcpServers – define local or remote MCP servers (Playwright, Supabase, etc.); you can add, edit, or remove servers and their CLI arguments.
        - enabledMcpjsonServers / disabledMcpjsonServers – override servers that live in .mcp.json files
      - Tool Permissions
        - allowedTools – restrict which built-in tools Claude may invoke in that repo
      - Ignore Patterns
        - ignorePatterns – file globs Claude should ignore when searching/reading
      - Trust & Onboarding
        - hasTrustDialogAccepted / hasClaudeMdExternalIncludesApproved – flip these back to false to make Claude re-ask for trust/includes permissions
        - projectOnboardingSeenCount / hasCompletedProjectOnboarding – same idea as the global onboarding flags, but per repo
      - Examples
        - exampleFiles / exampleFilesGeneratedAt – controls the "example files" shown in prompts; you can prune or regenerate the list
    - And the following non-settings for each project:
      - history – complete chronological prompt history for that repo.
      - lastCost, lastAPIDuration, lastDuration, lastLinesAdded/Removed, lastTotalTokens – per-session analytics on token usage and cost.
      - lastSessionId – links back to the Claude backend logs.
    - And also the following for each project if it is available - however, you will have to look in the directory of the project to see if it exists: CLAUDE.md (rules for ai agent, we can just show it as markdown)
  - If Codex is selected (everything here located in the .codex/ directory in the files there - check them to see which)
    - "Global" section with the following subsections:
      - Model & Provider
        - model – choose which OpenAI model Codex should use (e.g. gpt-4o, o4-mini)
        - provider – select the active provider key (must match a key inside `providers`)
        - providers – table of provider definitions (name, baseURL, envKey) that you can add/edit/remove
      - Conversation Storage
        - disableResponseStorage – toggle whether Codex writes completed responses to disk
        - history.maxSize – maximum messages retained in a session transcript
        - history.saveHistory – on/off switch for recording conversation history
      - Privacy & Redaction
        - flexMode – enable automatic model fallback when quota/limits are reached
        - reasoningEffort – Low / Medium / High; controls chain-of-thought depth
        - history.sensitivePatterns – list of strings/regexes to redact before storage
      - Tools & Resource Limits
        - tools.shell.maxBytes / tools.shell.maxLines – capture limits for the Shell tool
      - Updates & Diagnostics
        - lastUpdateCheck – timestamp of the most recent update ping
    - "Logs" section (permanent, read-only):
      - history.json – quick-command history; include a "Clear history" button
      - sessions/ – archived transcripts; list files with ability to open or delete
    - "System Prompt":
      - instructions.md – Markdown editor for the persistent system prompt applied to every new session
    
