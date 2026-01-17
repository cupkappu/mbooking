import { Card, CardContent } from '@/components/ui/card';
import { Brain, Globe, GitBranch, BarChart3, Plug, Shield } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Double-Entry Bookkeeping',
    description:
      'Full support for five account categories (Assets, Liabilities, Equity, Revenue, Expense)',
  },
  {
    icon: Globe,
    title: 'Multi-Currency Support',
    description:
      'Native support for multiple currencies with exchange rate tracking',
  },
  {
    icon: GitBranch,
    title: 'Hierarchical Accounts',
    description: 'Unlimited nested account structure for organized finances',
  },
  {
    icon: BarChart3,
    title: 'Reports & Budgets',
    description:
      'Balance sheet, income statement, and budget tracking',
  },
  {
    icon: Plug,
    title: 'Plugin System',
    description: 'Extendable rate providers (JS plugins + REST API)',
  },
  {
    icon: Shield,
    title: 'Self-Hosted',
    description: 'Your data, your control. Deploy anywhere.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Key Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need for personal finance management
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
