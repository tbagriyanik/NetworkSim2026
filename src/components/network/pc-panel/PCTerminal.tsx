import React, { ComponentProps } from 'react';
import { ConsoleTerminalTab } from './ConsoleTerminalTab';

export type PCTerminalProps = ComponentProps<typeof ConsoleTerminalTab>;

export const PCTerminal: React.FC<PCTerminalProps> = (props) => {
  return <ConsoleTerminalTab {...props} />;
};
