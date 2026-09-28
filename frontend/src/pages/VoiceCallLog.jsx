import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import voiceService from '../services/voiceService';

const MOCK_LOGS = [
  {
    id: 1,
    batch_code: 'SIL-2026-89410',
    date: 'Today, 08:30 AM',
    risk_level: 'high',
    duration: '01:45',
    status: 'Completed',
    transcript: "नमस्कार. तुमच्या तपासलेल्या मका सायलेजमध्ये बुरशीची जोखमीची लक्षणे आढळली आहेत. कृपया हा चारा दुभत्या जनावरांना देण्यापूर्वी पुन्हा तपासा.",
    language: 'mr'
  },
  {
    id: 2,
    batch_code: 'SIL-2026-44122',
    date: 'Yesterday, 05:15 PM',
    risk_level: 'medium',
    duration: '01:10',
    status: 'Completed',
    transcript: "नमस्कार. तुमच्या चाऱ्यामध्ये सध्या मोठ्या जोखमीची लक्षणे आढळलेली नाहीत. साठवणुकीची योग्य काळजी घ्या आणि वेळोवेळी चारा तपासा.",
    language: 'mr'
  }
];

const VoiceCallLog = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [playingId, setPlayingId] = useState(null);

  const handlePlayCall = (log) => {
    if (playingId === log.id) {
      voiceService.stop();
      setPlayingId(null);
    } else {
      voiceService.speak(log.transcript, log.language);
      setPlayingId(log.id);
      
      voiceService.onEnd(() => {
        setPlayingId(null);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-extrabold text-dark-green">
          📞 AI Voice Call Agent Logs
        </h1>
        <p className="text-grey text-sm mt-1">
          Automated voice notifications sent to you regarding high-risk feed batches.
        </p>
      </div>

      <div className="space-y-4">
        {logs.map(log => (
          <div key={log.id} className={`card p-5 border-l-4 ${log.risk_level === 'high' ? 'border-red-500' : 'border-amber-500'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-dark-green text-lg">Batch {log.batch_code}</h3>
                <p className="text-xs text-grey">{log.date} • Duration: {log.duration}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.risk_level === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {log.risk_level === 'high' ? 'High Risk Call' : 'Advisory Call'}
              </span>
            </div>
            
            <div className="bg-light-grey p-4 rounded-xl text-sm italic text-dark mb-4">
              "{log.transcript}"
            </div>

            <button 
              onClick={() => handlePlayCall(log)}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              {playingId === log.id ? '⏹️ Stop Playback' : '▶️ Play Recording'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceCallLog;
