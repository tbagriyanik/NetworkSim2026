import React, { ComponentProps } from 'react';
import { ServicesTab } from './ServicesTab';

export type PCServicesProps = ComponentProps<typeof ServicesTab>;

export const PCServices: React.FC<PCServicesProps> = (props) => {
  return <ServicesTab {...props} />;
};
