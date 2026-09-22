// Re-export Auth component to maintain backward compatibility with /login route
import Auth from './Auth';

export default function Login() {
  return <Auth />;
}
