import React, { useState, useEffect, useRef } from 'react';
import { UserData, UsersMap } from '../types';
import { socketService } from '../services/socketService';
import ControlPanel from '../components/Dashboard/ControlPanel';
import { useI18n } from '../shared/i18n';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useI18n();
  const [users, setUsers] = useState<UsersMap>({});
  const [selectedUserIp, setSelectedUserIp] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Fallback sound URL

    socketService.connect();

    const handleInitialData = (data: UsersMap) => {
      setUsers(data);
    };

    const handleLocationUpdated = ({ ip, page }: { ip: string, page: string }) => {
      setUsers(prev => ({
        ...prev,
        [ip]: {
          ...prev[ip],
          ip, // Ensure IP exists if new
          currentPage: page,
          lastSeen: Date.now(),
          status: 'online',
          payments: prev[ip]?.payments || [],
          hasNewData: false,
          hasPayment: prev[ip]?.hasPayment || false,
          isBlocked: false,
          isFlagged: false
        }
      }));
    };

    const handleNewUserData = (data: Partial<UserData> & { ip: string }) => {
      setUsers(prev => ({
        ...prev,
        [data.ip]: {
          ...prev[data.ip],
          ...data,
          lastSeen: Date.now(),
          status: 'online',
          payments: prev[data.ip]?.payments || [],
          hasNewData: true
        }
      }));
      audioRef.current?.play().catch(e => console.log('Audio play failed', e));
    };

    const handleNewPayment = (data: any) => {
      setUsers(prev => ({
        ...prev,
        [data.ip]: {
          ...prev[data.ip],
          payments: [...(prev[data.ip]?.payments || []), data],
          hasNewData: true,
          hasPayment: true
        }
      }));
      audioRef.current?.play().catch(e => console.log('Audio play failed', e));
    };

    socketService.on('initialData', handleInitialData);
    socketService.on('locationUpdated', handleLocationUpdated);
    socketService.on('newUserData', handleNewUserData);
    socketService.on('newPayment', handleNewPayment);

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleOpenControl = (ip: string) => {
    setSelectedUserIp(ip);
    // Clear new data flag
    setUsers(prev => ({
      ...prev,
      [ip]: { ...prev[ip], hasNewData: false }
    }));
  };

  const usersList = (Object.values(users) as UserData[]).sort((a, b) => b.lastSeen - a.lastSeen);

  return (
    <div className="min-h-screen bg-gray-100 font-readex rtl" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-accent">V-Safety Dashboard</h1>
            <span className="bg-gray-700 px-3 py-1 rounded-full text-xs">Admin Panel</span>
          </div>
          <div className="text-sm text-gray-400">
            {t('activeUsers')}: {usersList.filter(u => Date.now() - u.lastSeen < 60000).length}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-700">{t('userList')}</h2>
            <button
              onClick={() => setUsers({})}
              className="text-red-600 hover:text-red-800 text-sm font-semibold"
            >
              {t('clearList')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                <tr>
                  <th className="p-4">{t('ipAddress')}</th>
                  <th className="p-4">{t('name')}</th>
                  <th className="p-4">{t('status')}</th>
                  <th className="p-4">{t('currentPage')}</th>
                  <th className="p-4">{t('newData')}</th>
                  <th className="p-4">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      {t('noOnlineUsers')}
                    </td>
                  </tr>
                ) : (
                  usersList.map((user) => {
                    const isOnline = Date.now() - user.lastSeen < 60000; // 1 min timeout
                    return (
                      <tr
                        key={user.ip}
                        className={`
                                    hover:bg-gray-50 transition-colors
                                    ${user.hasPayment ? 'bg-green-50' : ''}
                                    ${user.isFlagged ? 'bg-yellow-50' : ''}
                                `}
                        style={user.hasPayment ? { boxShadow: 'inset 4px 0 #28a745' } : {}}
                      >
                        <td className="p-4 font-mono text-sm text-gray-600">{user.ip}</td>
                        <td className={`p-4 font-semibold ${user.hasPayment ? 'text-green-800' : 'text-gray-800'}`}>
                          {user.name || t('visitor')}
                          {user.hasPayment && <span className="mr-2 text-xs bg-success text-white px-2 py-0.5 rounded">PAID</span>}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {isOnline ? t('online') : t('offline')}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-blue-600 dir-ltr text-right">
                          {user.currentPage}
                        </td>
                        <td className="p-4">
                          {user.hasNewData ? (
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-red-500/50 shadow-lg"></span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleOpenControl(user.ip)}
                            className="bg-brand hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm shadow transition-all hover:shadow-md"
                          >
                            {t('control')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {selectedUserIp && users[selectedUserIp] && (
        <ControlPanel
          user={users[selectedUserIp]}
          onClose={() => setSelectedUserIp(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;