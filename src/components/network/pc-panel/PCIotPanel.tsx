import React, { ComponentProps } from 'react';
import { IotDashboardTab } from './IotDashboardTab';

export type PCIotPanelProps = ComponentProps<typeof IotDashboardTab>;

export const PCIotPanel: React.FC<PCIotPanelProps> = (props) => {
  return <IotDashboardTab {...props} />;
};
