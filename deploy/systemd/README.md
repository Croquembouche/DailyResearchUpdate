# systemd service and timer

## User service, no sudo

This runs the web UI continuously without a Codex terminal session. The web service disables the app's in-process cron because report generation is handled by a dedicated systemd timer.

```bash
mkdir -p ~/.config/systemd/user
cp deploy/systemd/daily-research-update.user.service ~/.config/systemd/user/daily-research-update.service
systemctl --user daemon-reload
systemctl --user enable --now daily-research-update.service
```

## Daily 6 AM update timer, no sudo

This runs `npm run update` every morning at 6:00 AM America/New_York. `Persistent=true` means a missed run is triggered after the user systemd manager starts again.

```bash
cp deploy/systemd/daily-research-update-job.user.service ~/.config/systemd/user/daily-research-update-job.service
cp deploy/systemd/daily-research-update-job.user.timer ~/.config/systemd/user/daily-research-update-job.timer
systemctl --user daemon-reload
systemctl --user enable --now daily-research-update-job.timer
```

Useful operations:

```bash
systemctl --user status daily-research-update.service
systemctl --user status daily-research-update-job.timer
systemctl --user list-timers daily-research-update-job.timer
journalctl --user -u daily-research-update.service -f
journalctl --user -u daily-research-update-job.service -f
systemctl --user start daily-research-update-job.service
```

## System service, requires sudo

Use this if the service must run as a system unit instead of a user unit. If prompted for a password, run these commands in your own terminal:

```bash
sudo install -m 0644 deploy/systemd/daily-research-update.service /etc/systemd/system/daily-research-update.service
sudo install -m 0644 deploy/systemd/daily-research-update-job.service /etc/systemd/system/daily-research-update-job.service
sudo install -m 0644 deploy/systemd/daily-research-update-job.timer /etc/systemd/system/daily-research-update-job.timer
sudo systemctl daemon-reload
sudo systemctl enable --now daily-research-update.service
sudo systemctl enable --now daily-research-update-job.timer
```

The web service binds to `0.0.0.0:3001`, so devices on the reachable network can open `http://<this-machine-ip>:3001`.
