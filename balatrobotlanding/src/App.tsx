import { useState } from "react";
import {
  Bot,
  Trophy,
  Brain,
  Download,
  Play,
  Zap,
  Database,
  Cpu,
  Code,
  ChevronRight,
  Github,
  ExternalLink,
  Server,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader,
  GitPullRequest,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { saveUsername } from "./mongodb";
import { Command } from '@tauri-apps/api/shell';

function App() {
  // State for active tab in Tech Stack section
  const [activeTech, setActiveTech] = useState(0);

  // State for username form
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  // New state variables for two-step process
  const [isUsernameSaved, setIsUsernameSaved] = useState(false);
  const [isAgentStarting, setIsAgentStarting] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentError, setAgentError] = useState("");
  const [stdoutOutput, setStdoutOutput] = useState("");
  const [stderrOutput, setStderrOutput] = useState("");

  // Tech stack details
  const techStack = [
    {
      title: "Factory",
      description:
        "Our development platform of choice, enabling rapid iteration and collaborative AI-assisted coding.",
      icon: <Code className="h-8 w-8" />,
    },
    {
      title: "MongoDB",
      description:
        "Scalable database solution for storing user profiles, game statistics, and agent performance metrics.",
      icon: <Database className="h-8 w-8" />,
    },
    {
      title: "Strong Compute",
      description:
        "Powerful infrastructure for training our reinforcement learning models with millions of game simulations.",
      icon: <Server className="h-8 w-8" />,
    },
    {
      title: "CodeRabbit",
      description:
        "AI code review platform that helped optimize critical agent logic and decision-making algorithms.",
      icon: <GitPullRequest className="h-8 w-8" />,
    },
  ];

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username
    if (!username.trim()) {
      setFormStatus("error");
      setErrorMessage("Username cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setFormStatus("idle");

    try {
      // Save username to MongoDB
      const success = await saveUsername(username);

      if (success) {
        console.log("Username saved to MongoDB:", username);
        setFormStatus("success");
        setIsUsernameSaved(true); // Set username as saved
      } else {
        throw new Error("Failed to save to MongoDB");
      }
    } catch (error) {
      console.error("Error saving username:", error);
      setFormStatus("error");
      setErrorMessage("Failed to save to MongoDB. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle starting the agent
  const handleStartAgent = async () => {
    setIsAgentStarting(true);
    setAgentError("");
    setStdoutOutput("");
    setStderrOutput("");
    
    try {
      const scriptPath = '/Users/robertnowell/Library/Application Support/Steam/steamapps/common/Balatro/run_lovely_macos.sh';
      const workingDirectory = '/Users/robertnowell/Library/Application Support/Steam/steamapps/common/Balatro/';
      
      // AppleScript command to open Terminal and run the script
      const appleScriptCommand = `tell application "Terminal" to do script "cd \\"${workingDirectory}\\" && ./run_lovely_macos.sh"`;
      
      // Execute the AppleScript using the 'osascript' command
      const command = new Command('bash-runner', ['-c', `osascript -e '${appleScriptCommand}'`]);
      
      // Execute the command
      const child = await command.spawn();
      console.log('Balatro script launched in new Terminal with PID:', child.pid);
      
      // Set agent as running after a short delay to show loading state
      // The actual game UI will appear in the new terminal window
      setTimeout(() => {
        setIsAgentRunning(true);
        setIsAgentStarting(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start Balatro:', error);
      setAgentError(`Failed to start Balatro: ${error}`);
      setIsAgentStarting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white relative"
      style={{
        backgroundImage: "url('/balatro-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center p-2 bg-red-900/70 rounded-full mb-6 border-2 border-yellow-500/70">
                <Bot className="h-8 w-8 text-yellow-400" />
              </div>

              <div className="flex flex-col items-center justify-center">
                <img
                  src="/balatro-wordmark.png"
                  alt="Balatro Agent Logo"
                  className="w-full max-w-[500px] h-auto mx-auto"
                />
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500 mb-12">
                  AGENT
                </h1>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500 mb-6">
                Master Balatro with AI-Powered Optimal Play
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-10">
                Our Reinforcement Learning Agent helps you make smarter discard
                decisions to crush target scores.
              </p>
            </div>
          </div>
        </section>

        {/* About Balatro Section */}
        <section className="py-20 px-4 bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-yellow-400">
                About the Game
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Balatro is the roguelike poker deckbuilder taking the gaming
                world by storm. Build 5-card poker hands, discard for better
                draws, and beat target scores across escalating rounds. Our
                agent plays just like you — but smarter, faster, and more
                consistent.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-slate-900/80 border-yellow-600/50 hover:bg-slate-800/90 transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-red-900/70 flex items-center justify-center mb-4 border border-yellow-500/50">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </div>
                  <CardTitle className="text-yellow-400">
                    Award-Winning
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Winner of "Game of the Year" and numerous indie game awards
                    for its innovative gameplay
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-slate-900/80 border-yellow-600/50 hover:bg-slate-800/90 transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-red-900/70 flex items-center justify-center mb-4 border border-yellow-500/50">
                    <CreditCard className="h-6 w-6 text-yellow-400" />
                  </div>
                  <CardTitle className="text-yellow-400">
                    Deck Building
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Build powerful poker hands, leverage jokers for multipliers,
                    and strategically manage your resources
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-slate-900/80 border-yellow-600/50 hover:bg-slate-800/90 transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-red-900/70 flex items-center justify-center mb-4 border border-yellow-500/50">
                    <Play className="h-6 w-6 text-yellow-400" />
                  </div>
                  <CardTitle className="text-yellow-400">Game Goal</CardTitle>
                  <CardDescription className="text-gray-300">
                    Reach target scores across multiple stakes, unlock new
                    content, and discover synergistic card combinations
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="mt-12 p-8 bg-slate-900/70 rounded-xl border border-yellow-500/20">
              <p className="text-gray-300 text-lg leading-relaxed">
                Balatro challenges players to build poker hands, use jokers for
                powerful multipliers, and strategically manage their deck to
                reach increasingly difficult target scores. With its unique
                blend of poker mechanics and roguelike progression, every run
                offers new challenges and opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* Our Agent Section */}
        <section className="py-20 px-4 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-yellow-400">
                How the Agent Works
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our Balatro Agent uses reinforcement learning and LLM reasoning
                to decide which cards to discard from your 8-card hand.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="h-20 w-20 rounded-2xl bg-red-900/70 flex items-center justify-center mb-6 border-2 border-yellow-500/50">
                  <Brain className="h-10 w-10 text-yellow-400" />
                </div>

                <h3 className="text-2xl font-bold mb-4 text-yellow-400">
                  Reinforcement Learning
                </h3>

                <p className="text-gray-300 mb-6 leading-relaxed">
                  At every turn, it:
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Zap className="h-6 w-6 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">
                      Simulates all 5-card hand combos
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-6 w-6 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">
                      Calculates score potential
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-6 w-6 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">
                      Compares it to what you need to win
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="h-6 w-6 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-300">
                      If it's not enough — it intelligently discards cards to
                      improve your odds
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-8 border border-yellow-500/20">
                <h4 className="text-xl font-bold mb-4 text-yellow-400">
                  Agent Focus Areas
                </h4>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Hand Evaluation</span>
                    </div>
                    <p className="text-gray-300 mb-2">Simulating 5-card combos and estimating scores</p>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-yellow-500 h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">
                        Discard Optimization
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">Using reasoning to drop the weakest cards</p>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-yellow-500 h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Combo Recognition</span>
                    </div>
                    <p className="text-gray-300 mb-2">Spotting patterns like flushes, straights, and pairs</p>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-yellow-500 h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">
                        Target Score Success
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">Making decisions that lead to successful rounds</p>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-600 to-yellow-500 h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-20 px-4 bg-slate-900/60">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-yellow-400">
                Our Tech Stack
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Built with cutting-edge technologies for optimal performance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeTech === index
                      ? "bg-gradient-to-br from-red-900/70 to-slate-900/90 border border-yellow-500/50"
                      : "bg-slate-900/70 hover:bg-slate-800/80 border border-yellow-500/30"
                  }`}
                  onClick={() => setActiveTech(index)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-red-900/50 flex items-center justify-center mb-4 border border-yellow-500/30">
                      {tech.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-yellow-400">
                      {tech.title}
                    </h3>
                    <p className="text-gray-300">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Username Input Section */}
        <section className="py-20 px-4 bg-black/40">
          <div className="max-w-3xl mx-auto bg-slate-900/80 rounded-2xl p-10 border-2 border-yellow-500/30">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-yellow-400">
                Input your username to get started
              </h2>
              <p className="text-gray-300 mb-8">
                Try our AI agent. Simulated on millions of hands. Tuned to beat
                Balatro's toughest rounds. Input your username and test it out.
              </p>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={isUsernameSaved}
                    className={`w-full px-4 py-4 bg-slate-800/90 border-2 ${
                      formStatus === "error"
                        ? "border-red-500"
                        : "border-yellow-500/50"
                    } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors disabled:opacity-70`}
                  />
                </div>

                {formStatus === "error" && (
                  <div className="mb-4 flex items-center justify-center text-red-400">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {formStatus === "success" && (
                  <div className="mb-4 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Saved to MongoDB!</span>
                  </div>
                )}

                {agentError && (
                  <div className="mb-4 flex items-center justify-center text-red-400">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>{agentError}</span>
                  </div>
                )}

                {!isUsernameSaved ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-8 py-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-lg font-medium border-2 border-yellow-500/50 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span>Save</span>
                    )}
                  </Button>
                ) : (
                  <div className="mt-6">
                    {!isAgentRunning ? (
                      <Button
                        onClick={handleStartAgent}
                        disabled={isAgentStarting}
                        className="w-full px-8 py-6 bg-red-600 hover:bg-red-700 rounded-xl text-lg font-medium border-2 border-yellow-500/50 disabled:opacity-70"
                      >
                        {isAgentStarting ? (
                          <span className="flex items-center justify-center">
                            <Loader className="h-5 w-5 mr-2 animate-spin" />
                            Starting...
                          </span>
                        ) : (
                          <span>Start Agent</span>
                        )}
                      </Button>
                    ) : (
                      <div className="w-full px-8 py-6 bg-green-600 rounded-xl text-lg font-medium border-2 border-yellow-500/50 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Agent Running!
                      </div>
                    )}

                    {/* Display process output */}
                    {(stdoutOutput || stderrOutput) && (
                      <div className="mt-6 p-4 bg-slate-800/90 rounded-lg border border-yellow-500/30 text-left overflow-auto max-h-60">
                        <h4 className="text-yellow-400 font-semibold mb-2">Process Output:</h4>
                        {stdoutOutput && (
                          <div className="mb-2">
                            <h5 className="text-emerald-400 text-sm font-semibold">STDOUT:</h5>
                            <pre className="text-gray-300 text-xs whitespace-pre-wrap">{stdoutOutput}</pre>
                          </div>
                        )}
                        {stderrOutput && (
                          <div>
                            <h5 className="text-red-400 text-sm font-semibold">STDERR:</h5>
                            <pre className="text-gray-300 text-xs whitespace-pre-wrap">{stderrOutput}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 bg-black/80">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Bot className="h-6 w-6 text-yellow-400 mr-2" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-500">
                Balatro Agent
              </span>
            </div>

            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Documentation
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Support
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                GitHub
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                Discord
              </a>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-800">
            <p className="text-center text-gray-500 text-sm">
              © 2025 Balatro Agent. Not affiliated with Balatro or its creators.
              All game assets belong to their respective owners.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
