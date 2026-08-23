import React, { ComponentProps } from 'react';
import { IpSettingsTab } from './IpSettingsTab';

export type PCNetworkSettingsProps = ComponentProps<typeof IpSettingsTab>;

export const PCNetworkSettings: React.FC<PCNetworkSettingsProps> = (props) => {
  return <IpSettingsTab {...props} />;
};
