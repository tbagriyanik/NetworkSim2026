# ESC Key Cancellation - Quick Reference

## What Does ESC Do?

The **ESC** key now cancels long-running commands in all terminal interfaces.

## When to Use

### ✅ Works For:
- Ping commands (during execution)
- Traceroute/Tracert commands
- Long output displays
- Network diagnostics
- Any command showing "Processing..." indicator

### ❌ Doesn't Cancel:
- Password prompts (ESC already had this function)
- Confirmation dialogs (ESC already had this function)
- Reload confirmations (ESC already had this function)

## How It Works

### Terminal (Switches/Routers)
```
1. Type: ping 8.8.8.8
2. Command starts executing...
3. Press ESC
4. See: "Command cancelled" message
5. Input field is ready for new command
```

### PC Panel - CMD Tab
```
1. Type: tracert example.com
2. Trace starts...
3. Press ESC
4. See: "^C\nCommand cancelled"
5. Ready for new command
```

### PC Panel - Console Tab
```
1. Connected to router/switch
2. Type: ping 192.168.1.1
3. Ping starts...
4. Press ESC
5. Command sent to device with cancel token
6. Device stops the command
```

## Visual Feedback

### Toast Notification
```
┌─────────────────────────────┐
│ Command Cancelled           │
│ Long-running command has    │
│ been cancelled.             │
└─────────────────────────────┘
```

### Terminal Output
```
Switch#ping 8.8.8.8
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 8.8.8.8, timeout is 2 seconds:
^C
Command cancelled.
Switch#
```

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `ESC` | Cancel long-running command |
| `Ctrl+L` | Clear terminal |
| `Ctrl+C` | Copy selected text |
| `Ctrl+V` | Paste text |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+A` | Select all |
| `Tab` | Auto-complete command |
| `↑` | Previous command in history |
| `↓` | Next command in history |

## Language Support

Messages appear in the user's selected language:

- **Turkish**: "Komut İptal Edildi"
- **English**: "Command Cancelled"

## Tips & Tricks

💡 **Tip 1**: Watch for the "Processing..." indicator - that's when ESC will work.

💡 **Tip 2**: ESC won't interrupt password or confirmation prompts - those have their own cancellation logic.

💡 **Tip 3**: After cancellation, the input field is immediately ready for a new command.

💡 **Tip 4**: Works the same way on mobile, tablet, and desktop.

## Common Use Cases

### 1. Stopping a Long Ping
```bash
ping 8.8.8.8 count 100
# Press ESC after a few pings
```

### 2. Cancelling Traceroute
```bash
traceroute 192.168.1.1
# Press ESC if trace is taking too long
```

### 3. Interrupting Bulk Operations
```bash
# Multiple interface configurations
interface range fa0/1-24
# Press ESC if you change your mind
```

## Troubleshooting

**Q: ESC didn't cancel my command**
- A: Check if the command is actually still running (look for "Processing..." indicator)
- A: The command might have already completed

**Q: I pressed ESC during password entry**
- A: This cancels the password prompt and returns "Access denied"
- A: This is expected behavior for security

**Q: Can I customize the ESC key?**
- A: Not yet - this is planned for future updates

**Q: Does it work offline?**
- A: Yes, for local CMD commands
- A: For remote devices, connection is needed to send cancel token

## Technical Notes

For developers:
- Uses `__CANCEL__` special token
- Sets loading state to false immediately
- Displays standard cancellation message format: `^C\nCommand cancelled.`
- Toast notification duration: 2 seconds
