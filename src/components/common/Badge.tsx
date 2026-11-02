import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20',
    neutral: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} transition-colors`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: 'active' | 'inactive' | 'present' | 'late' | 'completed' | string }> = ({ status }) => {
  switch (status) {
    case 'active':
      return <Badge variant="success">Faol</Badge>;
    case 'inactive':
      return <Badge variant="danger">Nofaol</Badge>;
    case 'present':
      return <Badge variant="success">O'z vaqtida</Badge>;
    case 'late':
      return <Badge variant="warning">Kechikkan</Badge>;
    case 'completed':
      return <Badge variant="info">Yakunlangan</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: 'developer' | 'clinic_admin' | 'employee' | string }> = ({ role }) => {
  switch (role) {
    case 'developer':
      return <Badge variant="purple">Bosh Dasturchi</Badge>;
    case 'clinic_admin':
      return <Badge variant="info">Klinika Admini</Badge>;
    case 'employee':
      return <Badge variant="neutral">Xodim</Badge>;
    default:
      return <Badge variant="neutral">{role}</Badge>;
  }
};
