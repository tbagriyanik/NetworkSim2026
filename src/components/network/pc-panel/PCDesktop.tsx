import React, { ComponentProps } from 'react';
import { CommandLineTab } from './CommandLineTab';

export type PCDesktopProps = ComponentProps<typeof CommandLineTab>;

export const PCDesktop: React.FC<PCDesktopProps> = (props) => {
  return <CommandLineTab {...props} />;
};
