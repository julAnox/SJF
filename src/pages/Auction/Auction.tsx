import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  DollarSign,
  Percent,
  Package,
  Award,
  History,
  TrendingUp,
  Crown,
  Briefcase,
  Building2,
  GraduationCap,
  Rocket,
  CheckCircle2
} from 'lucide-react';
import AuctionTutorialModal from '../../components/Modals/AuctionTutorialModal';
import { ApplicationContext } from '../../App';
import { useAuth } from '../../contexts/AuthContext';

interface Bid {
  companyId: string;
  amount: number | string;
  timestamp: string;
}

interface Company {
  id: string;
  name: string;
  logo: string;
}

interface AuctionStage {
  id: number;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
}

const stages: AuctionStage[] = [
  {
    id: 1,
    name: 'salary',
    description: 'Base salary bidding',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'emerald'
  },
  {
    id: 2,
    name: 'equity',
    description: 'Company equity percentage',
    icon: <Percent className="w-6 h-6" />,
    color: 'emerald'
  },
  {
    id: 3,
    name: 'benefits',
    description: 'Social benefits package',
    icon: <Package className="w-6 h-6" />,
    color: 'emerald'
  },
  {
    id: 4,
    name: 'position',
    description: 'Job position and level',
    icon: <Award className="w-6 h-6" />,
    color: 'emerald'
  }
];

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp',
    logo: 'https://images.unsplash.com/photo-1549421263-6064833b071b?w=100&h=100&fit=crop'
  }
];

const positionLevels = [
  { level: 'Middle', color: 'bg-gray-700' },
  { level: 'Senior', color: 'bg-gray-700' },
  { level: 'Lead', color: 'bg-gray-700' },
  { level: 'Head', color: 'bg-gray-700' },
  { level: 'Director', color: 'bg-gray-700' }
];

const Auction = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { applicationCount, setApplicationCount } = useContext(ApplicationContext);
  const [countdown, setCountdown] = useState<number>(30);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [stageTime, setStageTime] = useState<number>(60);
  const [companyTurn, setCompanyTurn] = useState<number>(0);
  const [bidInput, setBidInput] = useState<string>('');
  const [benefitsInput, setBenefitsInput] = useState<string>('');
  const [bids, setBids] = useState<{ [key: string]: Bid[] }>({
    salary: [],
    equity: [],
    benefits: [],
    position: []
  });
  const [showResults, setShowResults] = useState<boolean>(false);
  const [auctionStarted, setAuctionStarted] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  useEffect(() => {
    if (applicationCount >= 3 && tutorialCompleted && countdown > 0 && !auctionStarted) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (countdown === 0 && !auctionStarted) {
      setAuctionStarted(true);
    }
  }, [countdown, auctionStarted, applicationCount, tutorialCompleted]);

  useEffect(() => {
    if (auctionStarted && currentStage < stages.length) {
      const timer = setInterval(() => {
        setStageTime((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            setCurrentStage((current) => current + 1);
            setStageTime(60);
            setBidInput('');
            setBenefitsInput('');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (currentStage >= stages.length) {
      setShowResults(true);
    }
  }, [auctionStarted, currentStage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBid = (companyId: string, value: number | string) => {
    const newBid: Bid = {
      companyId,
      amount: value,
      timestamp: new Date().toISOString()
    };

    switch (currentStage) {
      case 0:
        setBids(prev => ({ ...prev, salary: [...prev.salary, newBid] }));
        setBidInput('');
        break;
      case 1:
        setBids(prev => ({ ...prev, equity: [...prev.equity, newBid] }));
        setBidInput('');
        break;
      case 2:
        setBids(prev => ({ ...prev, benefits: [...prev.benefits, newBid] }));
        setBenefitsInput('');
        break;
      case 3:
        setBids(prev => ({ ...prev, position: [...prev.position, newBid] }));
        setBidInput('');
        break;
    }
  };

  const handleCompanySelect = async (companyId: string) => {
    setSelectedCompany(companyId);
    
    const chats = JSON.parse(localStorage.getItem('chats') || '{}');
    const chatId = `chat_${Date.now()}`;
    const company = mockCompanies.find(c => c.id === companyId);
    
    if (!company) return;

    const newChat = {
      id: chatId,
      companyId: companyId,
      companyName: company.name,
      messages: [
        {
          id: Date.now().toString(),
          senderId: 'system',
          type: 'text',
          content: 'Auction Results',
          timestamp: new Date().toISOString()
        },
        {
          id: (Date.now() + 1).toString(),
          senderId: 'system',
          type: 'text',
          content: `Salary: ${bids.salary.find(b => b.companyId === companyId)?.amount || '-'}`,
          timestamp: new Date().toISOString()
        },
        {
          id: (Date.now() + 2).toString(),
          senderId: 'system',
          type: 'text',
          content: `Equity: ${bids.equity.find(b => b.companyId === companyId)?.amount || '-'}%`,
          timestamp: new Date().toISOString()
        },
        {
          id: (Date.now() + 3).toString(),
          senderId: 'system',
          type: 'text',
          content: `Benefits: ${bids.benefits.find(b => b.companyId === companyId)?.amount || '-'}`,
          timestamp: new Date().toISOString()
        },
        {
          id: (Date.now() + 4).toString(),
          senderId: 'system',
          type: 'text',
          content: `Position: ${bids.position.find(b => b.companyId === companyId)?.amount || '-'}`,
          timestamp: new Date().toISOString()
        }
      ],
      lastMessage: 'Auction completed',
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    chats[chatId] = newChat;
    localStorage.setItem('chats', JSON.stringify(chats));

    localStorage.setItem('applications', '[]');
    setApplicationCount(0);

    navigate(`/chat/${chatId}`);
  };

  const getCurrentStageName = () => {
    return stages[currentStage]?.name || 'salary';
  };

  if (applicationCount < 3) {
    return (
      <div className="pt-20 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 mb-4"
            >
              <Briefcase className="w-8 h-8 text-emerald-400" />
              <Building2 className="w-8 h-8 text-blue-400" />
              <GraduationCap className="w-8 h-8 text-purple-400" />
              <Rocket className="w-8 h-8 text-amber-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Not Enough Applications
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              You need to apply to at least 3 positions before participating in the auction.
              <br />
              Currently applied to: {applicationCount} positions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!auctionStarted) {
    return (
      <div className="pt-20 min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4"
        >
          <div className="mb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 mb-4"
            >
              <Briefcase className="w-8 h-8 text-emerald-400" />
              <Building2 className="w-8 h-8 text-blue-400" />
              <GraduationCap className="w-8 h-8 text-purple-400" />
              <Rocket className="w-8 h-8 text-amber-400" />
            </motion.div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Talent Auction
            </h1>
            <p className="text-xl text-gray-400">
              Companies are competing for {user?.firstName} {user?.lastName}
            </p>
          </div>

          {tutorialCompleted && (
            <div className="bg-gray-800 rounded-2xl p-8 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-4 text-6xl font-mono font-bold text-emerald-400 mb-6">
                <Timer className="w-12 h-12" />
                <span>{countdown}</span>
              </div>
              <p className="text-gray-300 text-lg">
                The auction will begin shortly. Get ready to receive competitive offers from top companies!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6 text-center border border-emerald-500/20"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  {stage.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{stage.name}</h3>
                <p className="text-sm text-gray-400">{stage.description}</p>
              </motion.div>
            ))}
          </div>

          <AuctionTutorialModal
            isOpen={showTutorial}
            onClose={() => {
              setShowTutorial(false);
              setTutorialCompleted(true);
            }}
          />
        </motion.div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="pt-20 min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Auction Results</h2>
              <Crown className="w-8 h-8 text-amber-400" />
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-4 px-6 text-gray-400">Company</th>
                    <th className="py-4 px-6 text-emerald-400">Salary</th>
                    <th className="py-4 px-6 text-emerald-400">Equity</th>
                    <th className="py-4 px-6 text-emerald-400">Benefits</th>
                    <th className="py-4 px-6 text-emerald-400">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCompanies.map(company => {
                    const salaryBid = bids.salary.find(b => b.companyId === company.id);
                    const equityBid = bids.equity.find(b => b.companyId === company.id);
                    const benefitsBid = bids.benefits.find(b => b.companyId === company.id);
                    const positionBid = bids.position.find(b => b.companyId === company.id);

                    return (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}
                        onClick={() => !selectedCompany && handleCompanySelect(company.id)}
                        className={`border-b border-gray-700 cursor-pointer transition-colors ${
                          selectedCompany === company.id ? 'bg-gray-700' : ''
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <span className="text-white font-medium">{company.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-emerald-400 font-mono">
                          {salaryBid ? `₽${salaryBid.amount}` : '—'}
                        </td>
                        <td className="py-4 px-6 text-emerald-400 font-mono">
                          {equityBid ? `${equityBid.amount}%` : '—'}
                        </td>
                        <td className="py-4 px-6 text-emerald-400">
                          {benefitsBid ? benefitsBid.amount : '—'}
                        </td>
                        <td className="py-4 px-6 text-emerald-400">
                          {positionBid ? positionBid.amount : '—'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              {selectedCompany ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Company selected!</span>
                  </div>
                  <button
                    onClick={() => handleCompanySelect(selectedCompany)}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                  >
                    Continue to Chat
                  </button>
                </motion.div>
              ) : (
                <p className="text-gray-400">
                  Click on a company row to select their offer and start a conversation
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {auctionStarted && !showResults && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent pb-2">
                Talent Auction in Progress
              </h1>
              <p className="text-gray-400">Companies are competing for your talent</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-lg text-emerald-400 mb-4">
                      {user?.title || "Software Developer"}
                    </p>
                    <div className="flex gap-4 text-gray-400">
                      <span>{user?.experience || "2"} years experience</span>
                      <span>•</span>
                      <span>{user?.location || "Moscow"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </>
        )}

        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={false}
                animate={{ scale: currentStage === index ? 1.05 : 1 }}
                className={`flex-1 ${index > 0 ? 'ml-2' : ''}`}
              >
                <div
                  className={`rounded-lg p-4 transition-all duration-300 ${
                    currentStage === index
                      ? 'bg-emerald-600 border-2 border-emerald-400'
                      : currentStage > index
                      ? 'bg-gray-700 opacity-50'
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {stage.icon}
                    <span className="font-medium text-white">
                      {stage.name}
                    </span>
                  </div>
                  {currentStage === index && (
                    <div className="mt-2 text-sm text-emerald-200 text-center">
                      Current Stage
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                <span>Stage Time:</span>
                <span className="font-mono font-bold text-white">
                  {formatTime(stageTime)}
                </span>
              </div>
            </div>
            
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(stageTime / 60) * 100}%` }}
                className="h-full bg-emerald-500"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {mockCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-800 rounded-lg p-6 ${
                  companyTurn === index ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <h3 className="text-xl font-semibold text-white">
                      {company.name}
                    </h3>
                  </div>
                  {companyTurn === index && (
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
                      Current Turn
                    </span>
                  )}
                </div>

                {currentStage === 3 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {positionLevels.map(({ level, color }) => (
                      <button
                        key={level}
                        onClick={() => handleBid(company.id, level)}
                        className={`${color} p-2 rounded text-white text-center transition-colors hover:bg-gray-600`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                ) : currentStage === 2 ? (
                  <div>
                    <textarea
                      value={benefitsInput}
                      onChange={(e) => setBenefitsInput(e.target.value)}
                      disabled={companyTurn !== index}
                      placeholder="Describe benefits package..."
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-32 mb-4"
                    />
                    <button
                      onClick={() => companyTurn === index && handleBid(company.id, benefitsInput)}
                      disabled={companyTurn !== index || !benefitsInput.trim()}
                      className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
                    >
                      Submit Benefits
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={bidInput}
                      onChange={(e) => setBidInput(e.target.value)}
                      placeholder={currentStage === 0 ? "Enter salary" : "Enter equity percentage"}
                      className="flex-grow px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={companyTurn !== index}
                    />
                    <button
                      onClick={() => companyTurn === index && handleBid(company.id, parseInt(bidInput))}
                      disabled={companyTurn !== index || !bidInput}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600"
                    >
                      Bid
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 text-white mb-4">
              <History className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Bid History</h3>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {bids[getCurrentStageName()]
                .slice()
                .reverse()
                .map((bid, index) => {
                  const company = mockCompanies.find(c => c.id === bid.companyId);
                  if (!company) return null;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white">{company.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-mono font-bold">
                            {currentStage === 0 
                              ? `₽${bid.amount}`
                              : currentStage === 1
                                ? `${bid.amount}%`
                                : currentStage === 2
                                  ? 'Benefits submitted'
                                  : bid.amount}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auction;