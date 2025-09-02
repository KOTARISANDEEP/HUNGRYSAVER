import React, { useState } from 'react';
import { 
  MapPin, Calendar, User, Phone, Package, Clock, CheckCircle, AlertCircle, 
  Award, Heart, Users, ClipboardCheck, Star, MessageCircle, Settings,
  Gift, AlertTriangle, Shield, Home, Building
} from 'lucide-react';
import { CommunityRequest } from '../types/formTypes';
import DonorClaimModal from './DonorClaimModal';
import ImageViewerModal from './ImageViewerModal';

interface DonorCommunityRequestCardProps {
  request: CommunityRequest;
  onClaim: (requestId: string, donorAddress: string, notes: string) => Promise<void>;
}

const DonorCommunityRequestCard: React.FC<DonorCommunityRequestCardProps> = ({ request, onClaim }) => {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; images: string[]; initialIndex: number }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });

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

  const handleClaim = async (donorAddress: string, notes: string) => {
    await onClaim(request.id, donorAddress, notes);
  };

  const InitiativeIcon = getInitiativeIcon(request.initiative);

  // Don't show if already claimed
  if (request.status === 'DONOR_CLAIMED') {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 opacity-60">
        <div className="flex items-center space-x-2 text-orange-400 mb-4">
          <Package className="h-5 w-5" />
          <span className="font-medium">Already claimed by a donor</span>
        </div>
        <div className="text-gray-400 text-sm">
          This request has been claimed and the pickup flow has been initiated.
        </div>
      </div>
    );
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
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-400">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Approved by Volunteer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <MapPin className="h-4 w-4 text-[#eaa640]" />
              <span className="text-sm">{request.address}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="h-4 w-4 text-[#eaa640]" />
              <span className="text-sm">{request.beneficiaryName}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="h-4 w-4 text-[#eaa640]" />
              <span className="text-sm">{request.beneficiaryContact}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Calendar className="h-4 w-4 text-[#eaa640]" />
              <span className="text-sm">
                {request.createdAt?.toDate ? 
                  request.createdAt.toDate().toLocaleDateString() : 
                  new Date(request.createdAt).toLocaleDateString()
                }
              </span>
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
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowClaimModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#eaa640] hover:bg-[#eaa640]/80 rounded-lg text-black font-medium transition-colors"
          >
            <Gift className="h-5 w-5" />
            <span>Claim & Donate</span>
          </button>
        </div>
      </div>

      {/* Claim Modal */}
      <DonorClaimModal
        request={request}
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSubmit={handleClaim}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        onClose={() => setImageViewer({ isOpen: false, images: [], initialIndex: 0 })}
      />
    </>
  );
};

export default DonorCommunityRequestCard;
