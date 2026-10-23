import type { ComponentPropsWithRef } from 'react';
export function ActionButton({
  className = '',
  ...props
}: ComponentPropsWithRef<'button'>) {
  return (
    <button type="button" className={`action-btn ${className}`} {...props} />
  );
}
