import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Shield,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Tag
} from 'lucide-react';
import resolvedIssuesData from '../../data/resolved-issues.json';

const About = () => {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issue: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMoreIssues, setShowMoreIssues] = useState(false);

  const stats = [
    { value: '10,000+', label: t('about.stats.students') },
    { value: '500+', label: t('about.stats.employers') },
    { value: '5,000+', label: t('about.stats.placements') },
    { value: '98%', label: t('about.stats.satisfaction') }
  ];

  const values = [
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.description')
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('about.values.integrity.title'),
      description: t('about.values.integrity.description')
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('about.values.inclusion.title'),
      description: t('about.values.inclusion.description')
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t('about.values.impact.title'),
      description: t('about.values.impact.description')
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
    setFormData({ name: '', email: '', issue: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const initialIssues = resolvedIssuesData.resolvedIssues.slice(0, 6);
  const additionalIssues = resolvedIssuesData.resolvedIssues.slice(6, 9);

  return (
    <div className="pt-20 min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-blue-600 opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold text-white mb-6">{t('about.hero.title')}</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('about.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Stats Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">{t('about.mission.title')}</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                {t('about.mission.description')}
              </p>
            </motion.div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center p-6 bg-gray-900 rounded-xl"
                >
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-white mb-16"
          >
            {t('about.values.title')}
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gray-800 p-8 rounded-xl text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/10 text-emerald-400 mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">{t('about.faq.title')}</h2>
            <p className="text-gray-300">{t('about.faq.subtitle')}</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {t('about.faq.questions', { returnObjects: true }).map((faq: any, index: number) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-gray-900 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      openFaqIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-4"
                    >
                      <div className="text-gray-400">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bug Report Form Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">{t('about.bugReport.title')}</h2>
            <p className="text-gray-300">{t('about.bugReport.subtitle')}</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-gray-800 p-8 rounded-xl space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                {t('about.bugReport.form.name')}
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('about.bugReport.form.namePlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                {t('about.bugReport.form.email')}
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('about.bugReport.form.emailPlaceholder')}
                required
              />
            </div>

            <div>
              <label htmlFor="issue" className="block text-sm font-medium text-gray-300 mb-2">
                {t('about.bugReport.form.issue')}
              </label>
              <textarea
                id="issue"
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('about.bugReport.form.issuePlaceholder')}
                required
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                {t('about.bugReport.form.submit')}
              </button>
            </div>

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-emerald-400"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t('about.bugReport.form.success')}</span>
              </motion.div>
            )}
          </motion.form>
        </div>
      </section>

      {/* Recent Resolved Issues Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              {t('about.recentQuestions.title')}
            </h2>
            <p className="text-gray-300">
              Track our latest improvements and bug fixes
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Initial 6 issues */}
            {initialIssues.map((issue) => (
              <motion.div
                key={issue.id}
                variants={itemVariants}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                    {issue.category}
                  </span>
                </div>
                <p className="text-gray-400 mb-4">{issue.description}</p>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Solution</span>
                  </div>
                  <p className="text-gray-300">{issue.solution}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(issue.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Tag className="w-4 h-4" />
                    <span>#{issue.id}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Additional 3 issues */}
            <AnimatePresence>
              {showMoreIssues && additionalIssues.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4">{issue.description}</p>
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Solution</span>
                    </div>
                    <p className="text-gray-300">{issue.solution}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(issue.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Tag className="w-4 h-4" />
                      <span>#{issue.id}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Toggle Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setShowMoreIssues(!showMoreIssues)}
              className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
            >
              {showMoreIssues ? (
                <>
                  Show Less
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t('about.recentQuestions.viewAll')}
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;