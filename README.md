# Vault Password Manager
(under development)
A secure, **offline** password manager built with Tauri, React, and TypeScript. Your passwords and notes are encrypted and stored locally on your device - completely offline, never in the cloud.

## Features

- **Military-grade encryption** with offline, local-only data storage
- **Password management** with secure generation and storage
- **Notes management** for secure text storage
- **Session persistence** with automatic logout
- **Dark/light theme** with system preference detection
- **Keyboard shortcuts** for power users (Cmd/Ctrl + 1-4, Escape, Cmd/Ctrl + L)
- **Responsive design** for all screen sizes
- **Modern UI** with shadcn/ui components


## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable)
- Platform-specific dependencies for Tauri

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run tauri dev
   ```

### Building for Production

```bash
npm run tauri build
```

## Usage

1. **First Launch**: Set up your master password
2. **Login**: Enter your master password to access the vault
3. **Passwords**: Add, edit, and organize your passwords
4. **Notes**: Store secure notes and sensitive information
5. **Settings**: Customize theme and application preferences

## Keyboard Shortcuts

- `Cmd/Ctrl + 1`: Navigate to Dashboard
- `Cmd/Ctrl + 2`: Navigate to Passwords
- `Cmd/Ctrl + 3`: Navigate to Notes
- `Cmd/Ctrl + 4`: Navigate to Settings
- `Escape`: Close modals and dialogs
- `Cmd/Ctrl + L`: Logout

## Security

- All data is encrypted and stored locally
- Master password is hashed using PBKDF2/Argon2
- No data is ever transmitted to external servers
- Session management with automatic timeout

