const fs = require('fs');
let content = fs.readFileSync('src/lib/network/core/showCommands.ts', 'utf8');

const newContent = `function cmdShowSnmp(state: SwitchState, _input: string, _ctx: CommandContext): CommandResult {
  const chassis = state.version?.serialNumber || 'XXXXXXXXXXXX';
  const contact = state.snmpContact || 'unconfigured';
  const location = state.snmpLocation || 'unconfigured';
  const communities = Object.entries(state.snmpCommunities || {});

  let output = \`Chassis: \${chassis}\\n\`;
  output += \`Contact: \${contact}\\n\`;
  output += \`Location: \${location}\\n\`;
  output += \`0 SNMP packets input\\n\`;
  output += \`    0 Bad SNMP version errors\\n\`;
  output += \`    0 Unknown community name\\n\`;
  output += \`    0 Illegal operation for community name supplied\\n\`;
  output += \`    0 Encoding errors\\n\`;
  output += \`    0 Number of requested variables\\n\`;
  output += \`    0 Number of altered variables\\n\`;
  output += \`    0 Get-request PDUs\\n\`;
  output += \`    0 Get-next PDUs\\n\`;
  output += \`    0 Set-request PDUs\\n\`;
  output += \`0 SNMP packets output\\n\`;
  output += \`    0 Too big errors (Maximum packet size 1500)\\n\`;
  output += \`    0 No such name errors\\n\`;
  output += \`    0 Bad values errors\\n\`;
  output += \`    0 General errors\\n\`;
  output += \`    0 Response PDUs\\n\`;
  output += \`    0 Trap PDUs\\n\`;
  output += \`SNMP logging: \${state.loggingEnabled ? 'enabled' : 'disabled'}\\n\`;

  if (communities.length > 0) {
    output += \`SNMP communities:\\n\`;
    communities.forEach(([name, mode]) => {
      output += \`    \${name} \${mode}\\n\`;
    });
  } else {
    output += \`SNMP communities:\\n    <none configured>\\n\`;
  }

  return { success: true, output };
}`;

const oldLen = content.length;
content = content.replace(/function cmdShowSnmp\([\s\S]*?return \{ success: true, output \};\s*\}/, newContent);
console.log("Replaced?", oldLen !== content.length);
fs.writeFileSync('src/lib/network/core/showCommands.ts', content);
