import { render, screen, fireEvent } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

describe('DashboardPage', () => {
  it('should render dashboard title', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to your accounting dashboard')).toBeInTheDocument();
  });

  it('should display asset, liability, and net worth cards', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00')).toHaveLength(3);
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
  });

  it('should show empty state for transactions', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText(/No transactions yet/)).toBeInTheDocument();
  });
});
