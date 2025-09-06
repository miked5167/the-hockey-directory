import React from 'react'

interface HighlightMatchesProps {
  text: string
  searchQuery: string
  className?: string
}

export function HighlightMatches({ text, searchQuery, className = "" }: HighlightMatchesProps) {
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>
  }

  const query = searchQuery.trim().toLowerCase()
  const textLower = text.toLowerCase()
  
  if (!textLower.includes(query)) {
    return <span className={className}>{text}</span>
  }

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let matchIndex = textLower.indexOf(query)

  while (matchIndex !== -1) {
    // Add text before the match
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex))
    }

    // Add highlighted match
    const matchText = text.slice(matchIndex, matchIndex + query.length)
    parts.push(
      <mark 
        key={matchIndex} 
        className="bg-yellow-200 text-yellow-900 font-medium rounded px-0.5"
      >
        {matchText}
      </mark>
    )

    lastIndex = matchIndex + query.length
    matchIndex = textLower.indexOf(query, lastIndex)
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <span className={className}>{parts}</span>
}

export function getSearchMatchScore(text: string, searchQuery: string): number {
  if (!searchQuery.trim() || !text) return 0

  const query = searchQuery.trim().toLowerCase()
  const textLower = text.toLowerCase()
  
  // Exact match gets highest score
  if (textLower === query) return 100
  
  // Starts with query gets high score
  if (textLower.startsWith(query)) return 80
  
  // Contains query gets medium score
  if (textLower.includes(query)) return 60
  
  // No match
  return 0
}

export function sortBySearchRelevance<T>(
  items: T[], 
  searchQuery: string,
  getSearchableText: (item: T) => string[]
): T[] {
  if (!searchQuery.trim()) return items

  return items.sort((a, b) => {
    const aTexts = getSearchableText(a)
    const bTexts = getSearchableText(b)
    
    const aScore = Math.max(...aTexts.map(text => getSearchMatchScore(text, searchQuery)))
    const bScore = Math.max(...bTexts.map(text => getSearchMatchScore(text, searchQuery)))
    
    return bScore - aScore
  })
}