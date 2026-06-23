# How to Run HSE Pro Enterprise

## What You Need

Only **Node.js** — download it free from **https://nodejs.org** (choose the LTS version).

That's it. No Docker, no PostgreSQL, no other software.

---

## Windows

1. Install Node.js from https://nodejs.org (LTS version)
2. Double-click **`START-WINDOWS.bat`**
3. The app opens in your browser automatically

**Login:** `admin@hse-pro.com` / `Password123!`

---

## Mac

1. Install Node.js from https://nodejs.org (LTS version)
2. Open Terminal, go to this folder:
   ```
   cd /path/to/hse-pro-enterprise
   bash START-MAC-LINUX.sh
   ```
3. The app opens in your browser automatically

---

## Linux

```bash
# Install Node.js (Ubuntu/Debian)
sudo apt install nodejs npm

# Run the app
bash START-MAC-LINUX.sh
```

---

## What happens on first run

1. Dependencies are installed automatically (~2 minutes)
2. A local database is created in your home folder (`~/.hse-pro-enterprise/`)
3. The app opens at **http://localhost:3000**

On subsequent runs it starts in about 10 seconds.

---

## Accounts

| Email | Password | Role |
|---|---|---|
| admin@hse-pro.com | Password123! | System Owner (full access) |
| safety@hse-pro.com | Password123! | Safety Officer |
| supervisor@hse-pro.com | Password123! | Supervisor |
| worker@hse-pro.com | Password123! | Worker |

---

## Stopping the app

Press **Ctrl+C** in the terminal window.

---

## Your data

All data is saved in: `~/.hse-pro-enterprise/pgdata/`

It persists between runs. To reset to a clean state, delete that folder.

---

## Troubleshooting

**"Node.js is not installed"** → Download from https://nodejs.org

**Port already in use** → Change ports in `launcher/index.js` (PG_PORT, API_PORT, APP_PORT)

**App won't start** → Delete `~/.hse-pro-enterprise/` and try again (this resets the database)
