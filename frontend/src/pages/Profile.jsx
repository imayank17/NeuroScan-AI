import { motion } from 'framer-motion';
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi';

export default function Profile({ user }) {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold text-white mb-8">Profile</h1>

          <div className="glass-card p-8">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-heading font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-white">{user?.full_name}</h2>
                <p className="text-gray-400">@{user?.username}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <FiUser className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="text-white font-medium">{user?.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <FiMail className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <FiCalendar className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-white font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
