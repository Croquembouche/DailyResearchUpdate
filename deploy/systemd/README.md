# systemd service

## User service, no sudo

This keeps the web app running without a Codex terminal session. It starts when the `william` user systemd manager starts.

```bash
mkdir -p ~/.config/systemd/user
cp deploy/systemd/daily-research-update.user.service ~/.config/systemd/user/daily-research-update.service
systemctl --user daemon-reload
systemctl --user enable --now daily-research-update.service
```

Useful operations:

```bash
systemctl --user status daily-research-update.service
journalctl --user -u daily-research-update.service -f
systemctl --user restart daily-research-update.service
```

## System service, requires sudo

Use this if the service must start at machine boot before user login. If prompted for a password, run these commands in your own terminal:

```bash
sudo install -m 0644 deploy/systemd/daily-research-update.service /etc/systemd/system/daily-research-update.service
sudo systemctl daemon-reload
sudo systemctl enable --now daily-research-update.service
```

The service binds to `0.0.0.0:3001`, so devices on the reachable network can open `http://<this-machine-ip>:3001`.
