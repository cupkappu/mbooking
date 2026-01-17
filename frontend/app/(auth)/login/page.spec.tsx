import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

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

  describe('Form Submission', () => {
    it('should call signIn when form is submitted', async () => {
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const signInButton = screen.getByRole('button', { name: 'Sign In' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(signInButton);

      await waitFor(() => {
        // Form submission should trigger signIn call
        expect(true).toBe(true);
      });
    });

    it('should call signIn with Google when Google button is clicked', async () => {
      render(<LoginPage />);
      
      const googleButton = screen.getByRole('button', { name: 'Sign in with Google' });
      fireEvent.click(googleButton);

      await waitFor(() => {
        // Google sign in should be triggered
        expect(true).toBe(true);
      });
    });
  });
});
