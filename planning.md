## Summary of Changes: Adding IoT Web Panel to PC Device

This implementation introduces an "IoT Web Panel" feature to the PC device interface, allowing users to view and interact with connected IoT devices through a simulated web interface.

**1. New File: `src/lib/network/iotWebPanel.ts`**

*   **`generateIotWebPanelContent(iotDevices, language)`**:
    *   Generates an HTML string that lists all available IoT devices.
    *   Each IoT device is presented as a card with its name/ID and a "Connect" button.
    *   Clicking the "Connect" button sends a `postMessage` to the parent window (PCPanel.tsx) with a `type: 'open-iot-device'` and the `deviceId`, triggering the opening of the individual IoT device's management page.
    *   Includes basic styling for a user-friendly panel.
*   **`generateIotDevicePageContent(deviceId, deviceName, language)`**:
    *   Generates an HTML string for a simulated IoT device administration page.
    *   This page displays a login panel with pre-filled `username: 'admin'` and `password: 'admin'`.
    *   Includes basic styling for the login panel.

**2. Modified File: `src/components/network/PCPanel.tsx`**

*   **Imports**:
    *   Added imports for `generateIotWebPanelContent` and `generateIotDevicePageContent` from `src/lib/network/iotWebPanel.ts`.
    *   Added `LayoutGrid` to the `lucide-react` import for the new button's icon.
*   **`openHttpTarget` Function**:
    *   **Special URL Handling**: Enhanced to recognize and process two new special URLs:
        *   `gemini://iot-panel`: When this URL is targeted, it calls `generateIotWebPanelContent` to create the IoT device listing page and sets it as the `httpAppContent`.
        *   `gemini://iot-device/<deviceId>`: When a URL matching this pattern is targeted, it extracts the `deviceId`, finds the corresponding IoT device, and calls `generateIotDevicePageContent` to display the simulated admin page for that device, pre-filling `admin:admin` credentials.
*   **`handleRouterAdminMessage` Function**:
    *   **Iframe Communication**: Modified the `useEffect` hook that contains `handleRouterAdminMessage` to include `openHttpTarget` in its dependency array.
    *   Added a new condition to handle messages from the iframe with `data.type === 'open-iot-device'`. Upon receiving such a message, it extracts the `deviceId` and calls `openHttpTarget` with the `gemini://iot-device/<deviceId>` URL, effectively opening the selected IoT device's page.
*   **UI Integration**:
    *   A new "IoT Panel" button has been added to the PC panel's navigation tabs, positioned next to the "Desktop" button.
    *   This button uses the `LayoutGrid` icon and, when clicked, triggers `openHttpTarget('gemini://iot-panel')`, launching the IoT Web Panel.
    *   The button's styling is consistent with the existing navigation tabs.

These changes collectively enable a simulated web-based management interface for IoT devices directly from the PC device in the network simulator.