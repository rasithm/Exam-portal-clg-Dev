import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Shield, Users, BookOpen, ArrowRight, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Advanced Security",
      description: "Anti-cheating measures with real-time monitoring and violation detection"
    },
    {
      icon: Users,
      title: "Multi-Role Management",
      description: "Separate dashboards for administrators and students with role-based access"
    },
    {
      icon: BookOpen,
      title: "Flexible Question Types",
      description: "Support for MCQ, descriptive, and coding questions with automated grading"
    },
    {
      icon: CheckCircle,
      title: "Instant Results",
      description: "Automated evaluation with detailed analytics and reporting features"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-4 gradient-primary rounded-2xl shadow-hero">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-foreground">ExamPro</h1>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Professional Exam
            <br />
            <span className="gradient-primary bg-clip-text text-transparent">
              Management System
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Create secure, comprehensive examinations for your educational institution with advanced 
            anti-cheating measures, automated grading, and detailed analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/login")}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 bg-white/80 backdrop-blur-sm"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Choose ExamPro?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for educational institutions requiring secure, scalable examination solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-elevated border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="p-3 rounded-xl bg-primary-light w-fit mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-elevated border-0 gradient-card">
            <CardContent className="p-12 text-center">
              <h3 className="text-3xl font-bold text-card-foreground mb-4">
                Ready to Transform Your Examinations?
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join educational institutions worldwide who trust ExamPro for their secure examination needs.
              </p>
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-6"
                // onClick={() => navigate("/setup")}
                onClick={() => navigate("/login")}
              >
                Start Your Free Setup
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
