

## Known exposure: GitHub SSH key in history

A GitHub SSH private key was committed to `.replit` and removed in
`b936a02` ("Remove leaked SSH private key from .replit"). **Removing it from a
later commit did not remove it from the repository.** It remains recoverable
from at least nine commits reachable from `main`, and anyone who has ever cloned
this repository already holds a copy.

The key is passphrase-protected, which buys time rather than safety — an
attacker with the file can attempt the passphrase offline, without limit and
without anything showing up in a log.

**The fix is revocation, not deletion.** Remove the key from
github.com → Settings → SSH and GPG keys, and generate a new one. Rewriting
history is optional and secondary: it does nothing about copies already cloned,
and it rewrites every commit hash, which breaks open pull requests and every
existing clone. Revoke first; decide about history afterwards.

Verified clean as of the last audit: no M-Pesa, Flutterwave, Resend, Anthropic,
OpenAI, WhatsApp or Africa's Talking credentials appear anywhere in history, and
no other private key has ever been committed. Every env assignment in a tracked
file is empty.

`.github/workflows/secret-scan.yml` runs gitleaks on every pull request and on
pushes to `main`, so the next one is caught before it merges.
