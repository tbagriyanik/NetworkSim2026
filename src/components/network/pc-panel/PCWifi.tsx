import React, { ComponentProps } from 'react';
import { WirelessConfigTab } from './WirelessConfigTab';

export type PCWifiProps = ComponentProps<typeof WirelessConfigTab>;

export const PCWifi: React.FC<PCWifiProps> = (props) => {
  return <WirelessConfigTab {...props} />;
};
