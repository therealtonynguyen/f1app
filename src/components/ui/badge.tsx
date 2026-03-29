import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary/15 text-primary border border-primary/20',
        secondary:   'bg-secondary text-secondary-foreground',
        muted:       'bg-muted/60 text-muted-foreground',
        accent:      'bg-accent/15 text-accent border border-accent/20',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/20',
        outline:     'border border-border text-foreground',
        live:        'bg-green-500/15 text-green-400 border border-green-500/25',
        ghost:       'bg-white/5 text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
