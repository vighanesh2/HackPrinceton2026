# Pushing the `Open-Claw` branch

This branch is based on **`main`** with **OpenClaw-only** commits on top (skill + docs + `.gitignore` / README). The **`Agent`** branch holds separate in-app agent / UI work.

## Author (this repo)

```bash
git config user.name "Sri Ram Swaminathan"
git config user.email "srirams2403@gmail.com"
```

## Push

```bash
git checkout Open-Claw
git push -u origin Open-Claw
```

If GitHub rejects a non-fast-forward update (branch diverged), only use a force push if your team agrees:

```bash
git push --force-with-lease -u origin Open-Claw
```

## Verify

```bash
git log --oneline main..Open-Claw
```

You should see only the OpenClaw-related commits, not the full `Agent` branch history.
