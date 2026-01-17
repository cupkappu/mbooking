export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your accounting dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Total Assets</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Total Liabilities</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
      </div>

      <div className="p-6 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <p className="text-muted-foreground">No transactions yet. Create your first journal entry to get started.</p>
      </div>
    </div>
  );
}
