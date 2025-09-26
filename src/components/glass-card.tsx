import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const GlassCard = ({ className, ...props }: React.ComponentProps<typeof Card>) => (
  <Card className={cn("bg-card/60 backdrop-blur-md border-border shadow-2xl", className)} {...props} />
);

export { GlassCard, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
