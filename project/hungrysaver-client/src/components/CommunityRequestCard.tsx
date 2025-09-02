import React, { useState } from 'react';
import { 
  MapPin, Calendar, User, Phone, Package, Clock, CheckCircle, AlertCircle, 
  Award, Heart, Users, ClipboardCheck, Star, MessageCircle, Settings,
  Check, X, Navigation, ThumbsUp, ThumbsDown, AlertTriangle, Shield, Home, Building
} from 'lucide-react';
import { CommunityRequest, CommunityRequestStatus } from '../types/formTypes';
import ImageViewerModal from './ImageViewerModal';

interface CommunityRequestCardProps {
  request: CommunityRequest;
  onAction: (action: 'accept' | 'deny' | 'mark-reached' | 'approve' | 'reject', requestId: string, data?: any) => Promise<void>;
  userData: any;
}

const CommunityRequestCard: React.FC<CommunityRequestCardProps> = ({ request, onAction, userData }) => {
  const [loading, setLoading] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; images: string[]; initialIndex: number }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });

  const getStatusInfo = (status: CommunityRequestStatus) => {
    switch (status) {
      case 'pending':
        return { text: 'Awaiting your action', color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: AlertTriangle };
      case 'VOLUNTEER_ACCEPTED':
        return { text: 'You accepted this request', color: 'text-blue-400', bg: 'bg-blue-400/20', icon: CheckCircle };
      case 'REACHED_COMMUNITY':
        return { text: 'Reached Community House', color: 'text-purple-400', bg: 'bg-purple-400/20', icon: Navigation };
      case 'APPROVED_BY_VOLUNTEER':
        return { text: 'Approved and waiting for donors', color: 'text-green-400', bg: 'bg-green-400/20', icon: ThumbsUp };
      case 'REJECTED_BY_VOLUNTEER':
        return { text: 'Closed', color: 'text-red-400', bg: 'bg-red-400/20', icon: X };
      case 'DONOR_CLAIMED':
        return { text: 'Donor claimed – pickup flow initiated', color: 'text-orange-400', bg: 'bg-orange-400/20', icon: Package };
      default:
        return { text: 'Unknown status', color: 'text-gray-400', bg: 'bg-gray-400/20', icon: AlertCircle };
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-400 bg-red-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'low':
        return 'text-green-400 bg-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getInitiativeIcon = (initiative: string) => {
    switch (initiative) {
      case 'annamitra-seva':
        return Heart;
      case 'vidya-jyothi':
        return Award;
      case 'suraksha-setu':
        return Shield;
      case 'punarasha':
        return Home;
      case 'raksha-jyothi':
        return AlertTriangle;
      case 'jyothi-nilayam':
        return Building;
      default:
        return Users;
    }
  };

  const getInitiativeName = (initiative: string) => {
    switch (initiative) {
      case 'annamitra-seva':
        return 'Annamitra Seva';
      case 'vidya-jyothi':
        return 'Vidya Jyothi';
      case 'suraksha-setu':
        return 'Suraksha Setu';
      case 'punarasha':
        return 'PunarAsha';
      case 'raksha-jyothi':
        return 'Raksha Jyothi';
      case 'jyothi-nilayam':
        return 'Jyothi Nilayam';
      default:
        return initiative;
    }
  };

  const handleAction = async (action: 'accept' | 'deny' | 'mark-reached' | 'approve' | 'reject') => {
    setLoading(true);
    try {
      let data: any = {};
      
      if (action === 'deny') {
        if (!denyReason.trim()) {
          alert('Please provide a reason for rejection');
          return;
        }
        data.reason = denyReason;
        setShowDenyModal(false);
        setDenyReason('');
      }
      
      if (action === 'approve' || action === 'reject') {
        data.notes = decisionNotes;
        setShowDecisionModal(false);
        setDecisionNotes('');
      }
      
      await onAction(action, request.id, data);
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = getStatusInfo(request.status);
  const StatusIcon = statusInfo.icon;
  const InitiativeIcon = getInitiativeIcon(request.initiative);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      alert('Address copied');
    } catch (e) {
      console.warn('Clipboard unavailable');
    }
  };

  // Don't show rejected requests
  if (request.status === 'REJECTED_BY_VOLUNTEER') {
    return null;
  }

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-[#eaa640]/50 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#eaa640]/20 rounded-lg">
              <InitiativeIcon className="h-6 w-6 text-[#eaa640]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{getInitiativeName(request.initiative)}</h3>
              <p className="text-sm text-gray-400">{request.initiative}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
              {request.urgency.toUpperCase()}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              <div className="flex items-center space-x-1">
                <StatusIcon className="h-3 w-3" />
                <span>{statusInfo.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Requester Details at top */}
          <div className="bg-gray-700/20 border border-gray-600/40 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
              <Users className="h-4 w-4 text-[#eaa640]" />
              <span className="font-medium">Requester Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="h-4 w-4 text-[#eaa640]" />
                <span>{request.beneficiaryName}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4 text-[#eaa640]" />
                {request.beneficiaryContact ? (
                  <a href={`tel:${request.beneficiaryContact}`} className="text-blue-300 hover:text-blue-200 underline">
                    {request.beneficiaryContact}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="md:col-span-2 flex items-start justify-between text-gray-300">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-[#eaa640] mt-0.5" />
                  <span>{request.address}</span>
                </div>
                {request.address && (
                  <button
                    onClick={() => copyToClipboard(request.address)}
                    className="ml-3 px-2 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Calendar className="h-4 w-4 text-[#eaa640]" />
                <span>
                  {request.createdAt?.toDate ? 
                    request.createdAt.toDate().toLocaleDateString() : 
                    new Date(request.createdAt).toLocaleDateString()
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-gray-300 text-sm">{request.description}</p>
          </div>

          {/* Images (if provided) */}
          {(request as any).imageUrl || (Array.isArray((request as any).imageUrls) && (request as any).imageUrls.length > 0) ? (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-300">Images:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {(((request as any).imageUrls as string[]) || [(request as any).imageUrl]).map((url: string, idx: number) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Request image ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-600 shadow-lg cursor-zoom-in"
                    onClick={() => setImageViewer({ isOpen: true, images: (((request as any).imageUrls as string[]) || [(request as any).imageUrl]), initialIndex: idx })}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Donor details once the request is approved/claimed */}
          {(request.status === 'APPROVED_BY_VOLUNTEER' || request.status === 'DONOR_CLAIMED') && (
            <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm text-blue-300 mb-1">
                <ThumbsUp className="h-4 w-4" />
                <span className="font-medium">Donor Engagement / Pickup Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="h-4 w-4 text-[#eaa640]" />
                  <span>{(request as any).donorName || 'Donor'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Phone className="h-4 w-4 text-[#eaa640]" />
                  {((request as any).donorContact) ? (
                    <a href={`tel:${(request as any).donorContact}`} className="text-blue-300 hover:text-blue-200 underline">
                      {(request as any).donorContact}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                {(request as any).donorAddress && (
                  <div className="md:col-span-2 flex items-start justify-between text-gray-300">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-[#eaa640] mt-0.5" />
                      <span>{(request as any).donorAddress}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard((request as any).donorAddress)}
                      className="ml-3 px-2 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200"
                    >
                      Copy
                    </button>
                  </div>
                )}
                {(request as any).donorNotes && (
                  <div className="md:col-span-2 flex items-start space-x-2 text-gray-300">
                    <ClipboardCheck className="h-4 w-4 text-[#eaa640] mt-0.5" />
                    <span>{(request as any).donorNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          {request.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => setShowDenyModal(true)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Deny</span>
              </button>
            </>
          )}

          {request.status === 'VOLUNTEER_ACCEPTED' && request.volunteerId === userData?.uid && (
            <button
              onClick={() => handleAction('mark-reached')}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
            >
              <Navigation className="h-4 w-4" />
              <span>Mark Reached</span>
            </button>
          )}

          {request.status === 'REACHED_COMMUNITY' && request.volunteerId === userData?.uid && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDecisionModal(true)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => setShowDecisionModal(true)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          )}

          {request.status === 'APPROVED_BY_VOLUNTEER' && (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Approved and visible to donors</span>
            </div>
          )}

          {request.status === 'DONOR_CLAIMED' && (
            <div className="flex items-center space-x-2 text-orange-400">
              <Package className="h-5 w-5" />
              <span className="font-medium">Donor claimed - pickup flow initiated</span>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        onClose={() => setImageViewer({ isOpen: false, images: [], initialIndex: 0 })}
      />

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Reject Request</h3>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-4"
              rows={3}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDenyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('deny')}
                disabled={loading || !denyReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white font-medium"
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Make Decision</h3>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Add any notes about your decision (optional)..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-4"
              rows={3}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white font-medium"
              >
                {loading ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white font-medium"
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityRequestCard;
