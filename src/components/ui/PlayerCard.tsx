import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User, MapPin, Calendar } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  position: string;
  team: string;
  age?: number;
  location?: string;
  imageUrl?: string;
}

export function PlayerCard({ name, position, team, age, location, imageUrl }: PlayerCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-ice-100 rounded-full flex items-center justify-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-ice-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{position}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium text-ice-700">{team}</span>
          </div>
          
          {age && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{age} years old</span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}