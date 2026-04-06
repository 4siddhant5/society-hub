import React from 'react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const AppButton = ({ type = 'primary', ...props }) => {
  if (type === 'secondary') {
    return <SecondaryButton {...props} />;
  }

  const variant =
    type === 'danger' ? 'danger' :
    type === 'success' ? 'success' :
    type === 'warning' ? 'warning' :
    'primary';

  return <PrimaryButton {...props} variant={variant} />;
};

export default AppButton;
