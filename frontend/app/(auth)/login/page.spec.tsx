import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

// Mock next-auth to return unauthenticated status so login form is rendered
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/login'),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login page title', () => {
      render(<LoginPage />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<LoginPage />);

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should render password input field', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should render Google sign in button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update email value when typing', () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password value when typing', () => {
      render(<LoginPage />);
      
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput.value).toBe('password123');
    });
  });
});
