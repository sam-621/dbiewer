import { Check } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardPanel, CardTitle } from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';

type Billing = 'monthly' | 'annual';

interface Price {
  amount: string;
  note: string;
}

interface Plan {
  name: string;
  prices: Record<Billing, Price>;
  period: string;
  blurb: string;
  cta: string;
  flag?: string;
  featured?: boolean;
  features: React.ReactNode[];
}

const billingOptions: { value: Billing; label: string; badge?: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual', badge: '-21%' }
];

const free: Price = { amount: '$0', note: 'no credit card' };

const plans: Plan[] = [
  {
    name: 'Free',
    prices: { monthly: free, annual: free },
    period: 'forever',
    blurb: 'For solo exploration, local SQLite hacking, or trying out a managed Postgres.',
    cta: 'Start for free',
    features: [
      <>
        <b>1</b> live connection + unlimited <Code tone="foreground">SQLite</Code>
      </>,
      <>
        <b>50</b> AI credits per month
      </>,
      'Schema canvas + SQL playground',
      <>
        <b>7 days</b> of query history
      </>,
      'Community support'
    ]
  },
  {
    name: 'Pro',
    prices: {
      monthly: { amount: '$19', note: 'billed monthly · cancel anytime' },
      annual: { amount: '$15', note: '$180 billed yearly · save $48/year' }
    },
    period: 'month',
    blurb: 'For developers and small teams running production databases.',
    cta: 'Start a 14-day trial',
    flag: 'recommended',
    featured: true,
    features: [
      <>
        <b>10</b> live connections
      </>,
      <>
        <b>500</b> AI credits per month <span className="text-muted-foreground/72">·</span> extra
        packs from <b>$5</b>
      </>,
      <>
        Schema <b>snapshots</b> + diff between environments
      </>,
      <>
        <b>Unlimited</b> query history
      </>,
      <>
        <b>SSH tunnel</b> for private databases
      </>,
      'No watermarks on exports',
      'Priority email support'
    ]
  }
];

export function PricingPlans({ href }: { href: string }): React.ReactElement {
  const [billing, setBilling] = React.useState<Billing>('monthly');

  return (
    <>
      <div className="mt-9 flex justify-center">
        <SegmentedControl aria-label="Billing period">
          {billingOptions.map(option => (
            <SegmentedControlItem
              key={option.value}
              aria-pressed={billing === option.value}
              data-pressed={billing === option.value ? '' : undefined}
              onClick={() => setBilling(option.value)}
            >
              {option.label}
              {option.badge && (
                <Badge variant="success" size="sm" className="font-mono">
                  {option.badge}
                </Badge>
              )}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
        {plans.map(plan => {
          const price = plan.prices[billing];
          return (
            <Card
              key={plan.name}
              className={cn(
                plan.featured &&
                  'glow-corner border-primary/36 shadow-[inset_0_0_0_1px_--theme(--color-primary/36%),0_12px_40px_--theme(--color-black/30%)]'
              )}
            >
              <CardHeader className="gap-[18px] p-7 max-sm:p-6">
                <div className="flex items-center gap-2.5">
                  <CardTitle className="text-base tracking-[-0.01em]">{plan.name}</CardTitle>
                  {plan.flag && (
                    <Badge className="ml-auto font-semibold tracking-[0.04em] uppercase">
                      {plan.flag}
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-[44px] font-semibold tracking-[-0.02em]">
                      {price.amount}
                    </span>
                    <span className="text-[13px] text-muted-foreground">/ {plan.period}</span>
                  </div>
                  <div className="font-mono text-[11.5px] text-muted-foreground/72">
                    {price.note}
                  </div>
                </div>
                <p className="m-0 text-[13px] leading-normal text-muted-foreground">{plan.blurb}</p>
              </CardHeader>
              <CardPanel className="px-7 max-sm:px-6">
                <ul className="m-0 flex list-none flex-col gap-[9px] p-0">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-[9px] text-[13px] leading-normal text-foreground/80 [&_b]:font-medium [&_b]:text-foreground"
                    >
                      <Check className="mt-1 size-3 shrink-0 text-primary" strokeWidth={2.6} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardPanel>
              <CardFooter className="mt-auto p-7 max-sm:p-6">
                <Button
                  render={<a href={href} />}
                  variant={plan.featured ? 'default' : 'outline'}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
