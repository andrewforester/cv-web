---
name: linear-screenshot
description: Upload an image (web check screenshot, before/after pair, the human's device screenshot) to a CV Andrew Panasiuk Linear ticket and embed it in a ticket comment. Use whenever a session has to put a screenshot on a ticket; screenshots never go into git.
---

# Screenshot to a Linear ticket

Screenshots of results live on the ticket, never in git (not on feature branches, not on a `screens` branch). One file at a time, with the Linear MCP (`linear-grandtorino`):

1. `prepare_attachment_upload` (`issue: CV-N`, `filename`, `contentType: image/png` or `image/jpeg`, `size` = exact bytes: `stat -f%z <file>` on macOS, `stat -c%s <file>` on Linux).
2. Within 60 s: `curl -sS -o /dev/null -w "%{http_code}" -X PUT --data-binary @<file> <uploadRequest.url>` with **every** header from `uploadRequest.headers` verbatim (`content-type`, `cache-control`, `x-goog-content-length-range`, `Content-Disposition`); expect `200`.
3. `create_attachment_from_upload` (`issue`, `assetUrl`).
4. Embed it in a ticket comment (`save_comment`, with your role tag) as `![<name>](<assetUrl>)`: the plain `assetUrl` without a signature (Linear signs it). Several images can share one comment.

Read images back with `extract_images`. Keep them reasonable: crop close-ups, JPEG for large full-page mobile shots.
