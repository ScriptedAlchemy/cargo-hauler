---
'cargo-hauler': minor
---

New `hauler_dashboard` MCP tool carries the dashboard App
(`ui://cargo-hauler/dashboard.html`): hosts that render MCP Apps open the
dashboard beside its result, populated from the same status payload the App
then polls through `hauler_status`. Its text result is one summary line plus
where the App and the text form are, so opening the dashboard never pastes the
status document into the model's context. `hauler_status` no longer advertises
the App and returns the queue, lanes, and tickets as text for the model, as
before. `hauler web` opens the App through `hauler_dashboard`. The
`hauler-dashboard` skill and the status document's dashboard line name the new
tool.
