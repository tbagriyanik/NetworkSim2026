## Summary of Changes: IoT Web Panel Enhancements

This implementation introduces an enhanced "IoT Web Panel" feature to the PC device interface, allowing users to securely view and manage connected IoT devices through a simulated web interface with authentication and device control capabilities.

**1. New File: `src/lib/network/iotWebPanel.ts`**

*   **`generateIotWebPanelContent(iotDevices, language)`**:
    *   Generates an HTML string that lists all available IoT devices.
    *   **Password Protection**: Secure login form with username/password fields (both default to "admin")
    *   **Session-Based Authentication**: Uses sessionStorage to remember login state
    *   **Auto-fill**: Username field is pre-filled with "admin" for convenience
    *   **Enter Key Support**: Supports Enter key for both username and password fields
    *   Each IoT device is presented as a card with its name/ID and a "Connect" button.
    *   Clicking the "Connect" button sends a `postMessage` to the parent window (PCPanel.tsx) with a `type: 'open-iot-device'` and the `deviceId`.
    *   Includes modern styling with responsive design and Turkish/English language support.
*   **`generateIotDevicePageContent(deviceId, deviceName, language)`**:
    *   Generates an HTML string for a simulated IoT device administration page.
    *   **Device Information Panel**: Displays device ID, name, and current status
    *   **Active/Inactive Toggle**: Toggle switch to control IoT reading activation (collaborationEnabled property)
    *   **Back to List Button**: Returns to IoT device list without re-authentication
    *   **Real-time Status Updates**: Visual feedback for active/inactive states with color coding
    *   **Message Communication**: Sends `toggle-iot-device` and `back-to-iot-list` messages to parent window
    *   Includes modern styling with toggle switch UI and Turkish/English language support.

**2. Modified File: `src/components/network/PCPanel.tsx`**

*   **Imports**:
    *   Added imports for `generateIotWebPanelContent` and `generateIotDevicePageContent` from `src/lib/network/iotWebPanel.ts`.
    *   Added `LayoutGrid` to the `lucide-react` import for the new button's icon.
*   **`openHttpTarget` Function**:
    *   **Special URL Handling**: Enhanced to recognize and process two new special URLs:
        *   `http://iot-panel`: When this URL is targeted, it calls `generateIotWebPanelContent` to create the IoT device listing page and sets it as the `httpAppContent`.
        *   `iot://iot-device/<deviceId>`: When a URL matching this pattern is targeted, it extracts the `deviceId`, finds the corresponding IoT device, and calls `generateIotDevicePageContent` to display the simulated admin page for that device.
*   **`handleRouterAdminMessage` Function**:
    *   **Iframe Communication**: Modified the `useEffect` hook that contains `handleRouterAdminMessage` to include `openHttpTarget` in its dependency array.
    *   **Message Handlers**:
        *   `open-iot-device`: Opens individual IoT device management page
        *   `back-to-iot-list`: Returns to IoT device list by calling `openHttpTarget('http://iot-panel')`
        *   `toggle-iot-device`: Toggles IoT device reading activation by updating `collaborationEnabled` property
    *   **Device Status Update**: Sends `update-topology-device-config` event to update IoT device configuration
*   **Backdrop Blur Effect**:
    *   Added `backdrop-blur-sm bg-black/20` to the browser popup overlay
    *   Creates visual blur effect on background when browser popup opens
*   **UI Integration**:
    *   A new "IoT Panel" button has been added to the PC panel's navigation tabs, positioned next to the "Desktop" button.
    *   This button uses the `LayoutGrid` icon and, when clicked, triggers `openHttpTarget('http://iot-panel')`, launching the IoT Web Panel.
    *   The button's styling is consistent with the existing navigation tabs.

These changes collectively enable a secure, feature-rich web-based management interface for IoT devices directly from the PC device in the network simulator, with authentication, device control, and improved user experience.