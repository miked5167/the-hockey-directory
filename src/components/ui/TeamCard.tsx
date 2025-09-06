import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, MapPin, Trophy } from 'lucide-react';

interface TeamCardProps {
  name: string;
  league: string;
  location: string;
  founded?: number;
  logoUrl?: string;
  playerCount?: number;
}

export function TeamCard({ name, league, location, founded, logoUrl, playerCount }: TeamCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-ice-100 rounded-full flex items-center justify-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${name} logo`} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Trophy className="h-6 w-6 text-ice-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{league}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{location}</span>
          </div>
          
          {founded && (
            <div className="flex items-center text-sm text-gray-500">
              <span>Founded {founded}</span>
            </div>
          )}
          
          {playerCount && (
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>{playerCount} players</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}