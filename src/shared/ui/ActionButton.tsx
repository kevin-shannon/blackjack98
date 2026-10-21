import type { ButtonHTMLAttributes } from 'react';
export function ActionButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`action-btn ${className}`} {...props} />
  );
}
