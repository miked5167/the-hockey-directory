import { 
  format, 
  formatDistanceToNow, 
  isAfter, 
  isBefore, 
  isPast, 
  isFuture,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  differenceInYears,
  parseISO
} from 'date-fns'

// Common date formatting functions for hockey directory
export const formatters = {
  // Tournament dates: "Mar 15 - 17, 2025"
  tournamentDate: (startDate: Date, endDate: Date): string => {
    const start = format(startDate, 'MMM d')
    const end = format(endDate, 'd, yyyy')
    return `${start} - ${end}`
  },

  // Short date: "Mar 15, 2025"
  shortDate: (date: Date): string => format(date, 'MMM d, yyyy'),

  // Full date: "March 15, 2025"
  fullDate: (date: Date): string => format(date, 'MMMM d, yyyy'),

  // Time ago: "2 hours ago"
  timeAgo: (date: Date): string => formatDistanceToNow(date, { addSuffix: true }),

  // Age from birth year: calculates age from birth year
  ageFromYear: (birthYear: number): number => {
    return new Date().getFullYear() - birthYear
  },

  // Hockey season: "2024-25 Season"
  hockeySeason: (date: Date): string => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Hockey season typically runs Sept-May
    if (month >= 8) { // September or later
      return `${year}-${(year + 1).toString().slice(2)} Season`
    } else { // Before September
      return `${year - 1}-${year.toString().slice(2)} Season`
    }
  },

  // Registration deadline warning
  registrationStatus: (deadline: Date): { 
    status: 'open' | 'closing-soon' | 'closed' | 'past'
    message: string
    variant: 'default' | 'warning' | 'destructive'
  } => {
    const now = new Date()
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (isPast(deadline)) {
      return {
        status: 'past',
        message: 'Registration closed',
        variant: 'destructive'
      }
    } else if (daysUntil <= 7) {
      return {
        status: 'closing-soon',
        message: `Registration closes in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        variant: 'warning'
      }
    } else {
      return {
        status: 'open',
        message: `Registration open until ${format(deadline, 'MMM d')}`,
        variant: 'default'
      }
    }
  }
}

// Date range utilities
export const dateRanges = {
  // Get current hockey season date range
  getCurrentHockeySeason: (): { start: Date; end: Date } => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    if (currentMonth >= 8) { // September or later
      return {
        start: new Date(currentYear, 8, 1), // September 1st
        end: new Date(currentYear + 1, 4, 31) // May 31st next year
      }
    } else {
      return {
        start: new Date(currentYear - 1, 8, 1), // September 1st last year
        end: new Date(currentYear, 4, 31) // May 31st this year
      }
    }
  },

  // Get upcoming tournaments (next 6 months)
  getUpcomingTournamentsRange: (): { start: Date; end: Date } => {
    const now = new Date()
    return {
      start: now,
      end: addMonths(now, 6)
    }
  },

  // Get date range for monthly analytics
  getMonthlyRange: (monthsBack = 0): { start: Date; end: Date } => {
    const targetMonth = subMonths(new Date(), monthsBack)
    return {
      start: startOfMonth(targetMonth),
      end: endOfMonth(targetMonth)
    }
  }
}

// Validation utilities
export const validators = {
  // Check if tournament is currently accepting registrations
  isTournamentOpen: (registrationDeadline: Date, tournamentStart: Date): boolean => {
    const now = new Date()
    return isBefore(now, registrationDeadline) && isFuture(tournamentStart)
  },

  // Check if date is within hockey season
  isWithinHockeySeason: (date: Date): boolean => {
    const season = dateRanges.getCurrentHockeySeason()
    return isAfter(date, season.start) && isBefore(date, season.end)
  },

  // Validate age for hockey programs (typically 4-18)
  isValidHockeyAge: (age: number): boolean => {
    return age >= 4 && age <= 25 // Extended range for juniors/college
  }
}

// Convert string dates from database
export const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString
  return parseISO(dateString)
}