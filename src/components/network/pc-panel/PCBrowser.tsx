import React, { ComponentProps } from 'react';
import { HttpBrowserWindow } from './HttpBrowserWindow';

export type PCBrowserProps = ComponentProps<typeof HttpBrowserWindow>;

export const PCBrowser: React.FC<PCBrowserProps> = (props) => {
  return <HttpBrowserWindow {...props} />;
};
