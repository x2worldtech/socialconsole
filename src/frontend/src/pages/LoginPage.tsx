import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { MessageSquare, Zap, Users, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Branding */}
        <div className="space-y-8 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                SocialConsole
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Command-based chat for the modern era
            </p>
          </div>

          <div className="space-y-4">
            <FeatureItem
              icon={<Zap className="w-5 h-5" />}
              title="Command-Driven"
              description="Create, join, and manage channels with simple commands"
            />
            <FeatureItem
              icon={<Users className="w-5 h-5" />}
              title="Real-Time Chat"
              description="Instant messaging with a sleek, modern interface"
            />
            <FeatureItem
              icon={<Shield className="w-5 h-5" />}
              title="Secure & Private"
              description="Built on Internet Computer with Internet Identity"
            />
          </div>
        </div>

        {/* Right side - Login */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to start chatting with your community
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="lg"
              className="w-full text-lg h-14 rounded-xl"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                'Login with Internet Identity'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By logging in, you agree to our terms of service
            </p>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              New to SocialConsole? Your account will be created automatically
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
        © 2025. Built with ❤️ using{' '}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
