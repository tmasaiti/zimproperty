import React from 'react';
import { Property } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Building, MapPin, Clock, Ruler, DollarSign, Loader2 } from 'lucide-react';
import { format, formatDistance } from 'date-fns';

interface LeadCardProps {
  lead: Property;
  onPurchase: () => void;
  isPending: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onPurchase, isPending }) => {
  // Determine if the lead is "hot" (less than 24 hours old)
  const isHotLead = () => {
    const createdAt = new Date(lead.createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours < 24;
  };

  // Determine lead badge style
  const getLeadBadge = () => {
    if (isHotLead()) {
      return <Badge className="badge-hot">Hot Lead</Badge>;
    } else if (lead.isVerified) {
      return <Badge className="badge-verified">Verified Seller</Badge>;
    } else {
      return <Badge className="badge-standard">Standard Lead</Badge>;
    }
  };

  // Get property type icon
  const getPropertyIcon = () => {
    switch (lead.type) {
      case 'residential':
        return <Home className="h-5 w-5 text-gray-700" />;
      case 'commercial':
        return <Building className="h-5 w-5 text-gray-700" />;
      case 'land':
        return <MapPin className="h-5 w-5 text-gray-700" />;
      case 'apartment':
        return <Building className="h-5 w-5 text-gray-700" />;
      default:
        return <Home className="h-5 w-5 text-gray-700" />;
    }
  };

  // Lead price calculation based on type and verification
  const getLeadPrice = () => {
    if (lead.isVerified) {
      return 30; // Higher price for verified sellers
    } else if (isHotLead()) {
      return 20; // Medium price for hot leads
    } else {
      return 10; // Standard price
    }
  };

  // Format the time ago
  const timeAgo = formatDistance(new Date(lead.createdAt), new Date(), { addSuffix: true });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-secondary-100 text-secondary-700">
                {getPropertyIcon()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                {lead.type.charAt(0).toUpperCase() + lead.type.slice(1)} Property in {lead.location.charAt(0).toUpperCase() + lead.location.slice(1)}
              </h3>
              <div className="flex items-center mt-1">
                {getLeadBadge()}
                <span className="ml-2 text-xs text-gray-500 flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  Submitted {timeAgo}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                <span className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" /> {lead.location}
                </span>
                {lead.size && (
                  <span className="flex items-center">
                    <Ruler className="mr-1 h-4 w-4" /> {lead.size} sqm
                  </span>
                )}
                <span className="font-medium text-primary-700 flex items-center">
                  <DollarSign className="h-4 w-4" />
                  {lead.price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Button 
              className="bg-secondary-500 hover:bg-secondary-600"
              onClick={onPurchase}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buy Lead (${getLeadPrice()})
            </Button>
          </div>
        </div>
        
        {/* Property description - truncated */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 line-clamp-2">{lead.description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;
